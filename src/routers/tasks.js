const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middlewares/auth')

router.get('/tasks', auth, async (req, res) => {
	try {
		const match = {}
		const sort = {}
		if(req.query.completed) {
			match.completed = req.query.completed
		}
		if(req.query.sortBy) {
			const parts = req.query.sortBy.split(':')
			sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
		}
		await req.user.populate({
			path: 'tasks',
			match,
			options: {
				limit: parseInt(req.query.limit),
				skip: parseInt(req.query.skip),
				sort
			}
		}).execPopulate()
		res.send(req.user.tasks)
	} catch (error) {
		res.status(500).send(error)
	}
})

router.get('/tasks/:id', auth, async (req, res) => {
	try {
		const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
		if (!task) {
			return res.status(404).send()
		}
		
		res.send(task)
	} catch (error) {
		res.status(500).send(error)
		
	}
})

router.post('/tasks', auth, async (req, res) => {
	try {
		const task = new Task({
			...req.body,
			owner: req.user._id
		})
		const result = await task.save()
		res.send(result)
	} catch (error) {
		res.status(400).send(error)
	}
})

router.patch('/tasks/:id', auth, async (req, res) => {
	try {
		const task = await Task.findOne({id: req.params.id, owner: req.user._id})
		if (!task) {
			return res.status(404).send()
		}
		
		const updates = Object.keys(req.body)
		updates.map(update => task[update] = req.body[update])
		await task.save()
		
		res.send(task)
	} catch (error) {
		res.status(400).send()
	}
})

router.delete('/tasks/:id', auth, async (req, res) => {
	try {
		const task = await Task.findOneAndDelete({_id: req.params.id, owner: res.user._id})
		if (!task) {
			return res.status(404).send()
		}
		res.send(task)
	} catch (error) {
		res.status(400).send()
	}
})

module.exports = router
