import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
        user: "matkacontrol@gmail.com",
        pass: "pync zbru rbnm cepf",
    },
});


export const sendMail = async (options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) => {
    try {

        const request = await transporter.sendMail({
            from: 'matkacontrol@gmail.com', // sender address
            to: options.to, // list of receivers
            subject: options.subject, // Subject line
            text: options.text, // plain text body
            ...(options?.html && {
                html: options.html,
            })
        });

        console.log("Message sent: %s", request.messageId);

        return request;

    } catch (err) {
        console.log("🚀 ~ sendMail ~ err:", err)

    }
}