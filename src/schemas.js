import joi from "joi"

const signUpSchema = joi.object({
    name: joi.string().min(3).required().trim(),
    email: joi.string().email().required().trim(),
    password: joi.string().required()
})

export default signUpSchema
