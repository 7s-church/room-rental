const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");

admin.initializeApp();
const db = admin.firestore();
const app = require("express")();

app.use(cors({ origin: true }));
app.use(express.json());

const AUTHORIZED_EMAILS = ["xuxiaohui_64@livemail.tw", "yuxxxlouyen@gmail.com"]
// 驗證身份的 middleware
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).send("Unauthorized");
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userEmail = decodedToken.email;

        if (AUTHORIZED_EMAILS.includes(userEmail)) {
            req.user = decodedToken;
            return next();
        } else {
            return res.status(403).send("Forbidden: Unauthorized Email");
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).send("Unauthorized");
    }
};


app.post("/addBooking", async (req, res) => {
    const data = req.body;

    try {
        const docRef = await db.collection("bookings").add(data);
        res.status(200).send({ id: docRef.id });
    } catch (error) {
        console.error("Error adding document: ", error);
        res.status(400).send("Error saving booking");
    }
});

app.get("/getBookings", async (req, res) => {
    try {
        const snapshot = await db.collection("bookings").get();
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).send(bookings);
    } catch (error) {
        console.error("Error getting bookings: ", error);
        res.status(400).send("Error retrieving bookings");
    }
});

// 編輯 Booking（需登入）
app.put("/editBooking/:id", authenticate, async (req, res) => {
    const id = req.params.id;
    const newData = req.body;
    try {
        await db.collection("bookings").doc(id).update(newData);
        res.status(200).send({ id, ...newData });
    } catch (error) {
        console.error("Error updating booking: ", error);
        res.status(400).send("Error updating booking");
    }
});

// 刪除 Booking（需登入）
app.delete("/deleteBooking/:id", authenticate, async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection("bookings").doc(id).delete();
        res.status(200).send({ id, deleted: true });
    } catch (error) {
        console.error("Error deleting booking: ", error);
        res.status(400).send("Error deleting booking");
    }
});

// 新增 or 更新 allowNextYear 設定（只有授權者可用）
app.post("/setAllowNextYear", authenticate, async (req, res) => {
    const { allowNextYear } = req.body;

    if (typeof allowNextYear !== 'boolean') {
        return res.status(400).send("Invalid allowNextYear value");
    }

    try {
        await db.collection("config").doc("global").set(
            { allowNextYear }, { merge: true }
        );
        res.status(200).send({ success: true, allowNextYear });
    } catch (error) {
        console.error("Error updating allowNextYear: ", error);
        res.status(500).send("Error updating setting");
    }
});

// 任何人都可以讀取開放設定
app.get("/getAllowNextYear", async (req, res) => {
    try {
        const docSnap = await db.collection("config").doc("global").get();
        const data = docSnap.data() || {};
        res.status(200).send({ allowNextYear: data.allowNextYear ?? false });
    } catch (error) {
        console.error("Error fetching setting: ", error);
        res.status(500).send("Error fetching allowNextYear setting");
    }
});

exports.api = functions.https.onRequest(app);