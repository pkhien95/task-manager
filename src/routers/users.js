const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middlewares/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendAccountConfirmationEmail} = require('../emails/account')
const jwt = require('jsonwebtoken')

router.get('/users/me', auth, async (req, res) => {
	try {
		res.send(req.user)
	} catch (error) {
		res.status(500).send(error)
	}
})

router.get('/users/activate', async (req, res) => {
	try {
		const {accessToken} = req.query
		const {_id, iat} = jwt.decode(accessToken)
		const tokenExpired = Date.now() < iat
		if (tokenExpired) {
			return res.status(401).send('Activation link expired')
		}
		const user = await User.findById(_id)
		if (!user) {
			throw new Error()
		}
		if (user.activated) {
			return res.status(200).send('You already activated your account')
		}
		user.activated = true
		await user.save()
		res.send('Your account is activated successfully')
	} catch (error) {
		res.status(400).send()
	}
})

router.get('/users/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id, '-accessTokens')
		if (!user) {
			return res.status(404).send()
		}
		
		res.send(user)
	} catch (error) {
		res.status(500).send(error)
	}
})

router.post('/users', async (req, res) => {
	try {
		const user = new User(req.body)
		const result = await user.save()
		const token = await result.generateAuthToken()
		sendAccountConfirmationEmail(user.name, user.email, token)
		res.send(result)
	} catch (error) {
		res.status(400).send(error)
	}
})

router.patch('/users/me', auth, async (req, res) => {
	try {
		const updates = Object.keys(req.body)
		updates.map(update => req.user[update] = req.body[update])
		await req.user.save()
		res.send(req.user)
	} catch (error) {
		res.status(400).send()
	}
})

router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove()
		res.send(req.user)
	} catch (error) {
		res.status(400).send()
	}
})

router.post('/users/login', async (req, res) => {
	try {
		const {email, password} = req.body
		const user = await User.findByCredentials(email, password)
		if (!user.activated) {
			res.status(400).send('User has not been activated yet')
		}
		const token = await user.generateAuthToken()
		res.send({user, token})
	} catch (error) {
		res.status(400).send()
	}
})


router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.accessTokens = req.user.accessTokens.filter(accessToken => {
			return accessToken.token !== req.token
		})
		await req.user.save()
		res.send()
	} catch (error) {
		res.status(400).send()
	}
})

router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.accessTokens = []
		await req.user.save()
		res.send()
	} catch (error) {
		res.status(400).send()
	}
})

const upload = multer({
	limits: {
		fileSize: 10000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Please upload a valid image'))
		}
		cb(undefined, true)
	}
})

router.post('/users/me/avatar', auth, upload.single('file'), async (req, res) => {
	const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
	req.user.avatar = buffer
	await req.user.save()
	res.send()
}, (error, req, res, next) => {
	res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
	try {
		req.user.avatar = undefined
		await req.user.save()
		res.send()
	} catch (error) {
		res.status(400).send()
	}
})

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id)
		if (!user || !user.avatar) {
			throw new Error()
		}
		
		res.set('Content-Type', 'image/png')
		res.send(user.avatar)
	} catch (error) {
		res.status(400).send()
	}
})

module.exports = router
