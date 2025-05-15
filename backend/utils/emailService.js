const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

module.exports.sendShareEmail = async ({ to, taskTitle, link }) => {
  await transporter.sendMail({
    from: 'TaskCollab <noreply@taskcollab.com>',
    to,
    subject: `You've been shared a task: ${taskTitle}`,
    html: `
      <h2>Task Shared With You</h2>
      <p>You've been given access to the task: <strong>${taskTitle}</strong></p>
      <a href="${link}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none;">
        View Task
      </a>
    `
  });
};