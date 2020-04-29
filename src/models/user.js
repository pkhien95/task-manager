const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		validate: (value) => {
			if (!validator.isEmail(value)) {
				throw new Error('Email is invalid')
			}
		}
	},
	password: {
		type: String,
		required: true,
		minLength: 6,
		validate: (value) => {
			if (value.toLowerCase().includes('password')) {
				throw new Error('Password cannot contain "password"')
			}
		}
	},
	age: {
		type: Number,
		validate: (value) => {
			if (value < 0) {
				throw new Error('Age must be greater than zero')
			}
		}
	},
	accessTokens: [{token: {type: String}}],
	avatar: {
		type: Buffer
	},
	activated: {
		type: Boolean,
		default: false
	}
}, {
	timestamps: true
})

userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'owner'
})

userSchema.pre('save', async function (next) {
	const user = this
	if (user.isModified('password')) {
		user.password = await bcrypt.hash(user.password, 8)
	}
	next()
})

userSchema.pre('remove', async function (next) {
	const user = this
	await Task.deleteMany({owner: user._id})
	
	next()
})


userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({email})
	if (!user) {
		throw new Error('User does not exist')
	}
	const isMatch = await bcrypt.compare(password, user.password)
	if (!isMatch) {
		throw new Error('Password does not match')
	}
	return user
}

userSchema.methods.generateAuthToken = async function () {
	const user = this
	const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
	user.accessTokens.push({token})
	await user.save()
	return token
}

userSchema.methods.toJSON = function () {
	const user = this
	const userObject = user.toObject()
	delete userObject.password
	delete userObject.accessTokens
	delete userObject.avatar
	return userObject
}


const User = mongoose.model('User', userSchema)

module.exports = User
