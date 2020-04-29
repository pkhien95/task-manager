const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendAccountConfirmationEmail = async (name, email, token) => {
	try {
		const activationLink = `http://localhost:3000/users/activate?accessToken=${token}`
		await sgMail.send({
			from: 'pkhien95@gmail.com',
			to: 'pkhien95@gmail.com',
			subject: 'Task App account confirmation',
			text: `${name}, please click the link below to activate your account:\n${activationLink}`
		})
		console.log('Send email successfully to', email)
	} catch (error) {
		console.log(`Send email to ${email} failed:`, error)
	}
}

module.exports = {
	sendAccountConfirmationEmail
}
