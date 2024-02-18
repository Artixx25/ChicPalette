import nodemailer from 'nodemailer'

class MailService {
    
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }
    async sendActivationMail(to, link) {
        await this.transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject: 'Account activation ' + process.env.API_URL,
            text: '',
            html: `
            <div>
                <h1>For activation click to link below</h1>
                <a href="${link}">${link}</a>
            </div>
            `
        })
    }

    async sendSuppMail({from, userId, username, fullname, subject, description}) {

        await this.transporter.sendMail({
            from,
            to: process.env.SMTP_USER,
            subject: `From ${from}: ${subject}`,
            text: '',
            html: `
            Name: ${fullname};<br/> userId: ${userId};<br/> username: ${username};<br/>
             ${description}`
        })
    }
}

export default new MailService();