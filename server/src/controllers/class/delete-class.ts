import { type RequestHandler } from 'express'
import joi from '../../utils/joi'
import Class from '../../models/Class'
import Stack from '../../models/Stack'

const deleteClass: RequestHandler = async (req, res, next) => {
	try {
		const { uid } = req.auth || {}

		const validationError = await joi.validate(
			{
				classId: joi.instance.string().required(),
			},
			req.body
		)

		if (validationError) return next(validationError)

		const classId = String(req.body.classId || '')
		const selectedClass = await Class.findById(classId)

		if (!selectedClass) {
			return next({
				statusCode: 404,
				message: 'Could not find class',
			})
		}

		const membership = selectedClass.users.find(
			(user) => (user.account as any).toString() === uid?.toString()
		)

		if (!membership || membership.role !== 'owner') {
			return next({
				statusCode: 403,
				message: 'Only the class owner can delete this class',
			})
		}

		await Promise.all([
			Stack.updateMany({ class: selectedClass._id }, { $unset: { class: '' } }),
			Class.deleteOne({ _id: selectedClass._id }),
		])

		return next({
			statusCode: 200,
			message: 'Class deleted successfully',
		})
	} catch (error) {
		next(error)
	}
}

export default deleteClass

