function Input({ register, errors, id, type, rules, labelText, mark }) {
    return (<>
        <label className="form-label"><small className="text-danger">{mark}</small>{labelText}</label>
        <input {...register(id, rules)}
            type={type}
            className={`form-control ${errors[id] && 'is-invalid'}`}
            id={id}
            placeholder={`請輸入${labelText}`} />
        {errors[id] && (
            <div className="invalid-feedback">{errors?.[id]?.message}</div>
        )}
    </>)
}

export default Input