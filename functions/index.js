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

exports.api = functions.https.onRequest(app);