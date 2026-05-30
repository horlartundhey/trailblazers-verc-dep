// utils/emailService.js
const { Resend } = require('resend');

// Lazy-initialize so the key is read at call-time, not at require-time
let _resend = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

// The "from" address — must be a verified domain in Resend.
// During testing you can use: onboarding@resend.dev (only delivers to your own verified email)
const FROM_ADDRESS = () => process.env.EMAIL_FROM || 'Trailblazer <onboarding@resend.dev>';

/**
 * Send welcome email to new user
 * @param {Object} user - User object with email, name, role, memberCode
 * @param {String} tempPassword - Temporary password to send
 */
const sendWelcomeEmail = async (user, tempPassword) => {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_ADDRESS(),
      to: user.email,
      subject: 'Welcome to Trailblazer - Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Welcome to Trailblazer!</h2>
          <p>Hello ${user.name},</p>
          <p>Your account has been created successfully.</p>
          
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Account Details:</h3>
            <p><strong>Role:</strong> ${user.role}</p>
            ${user.memberCode ? `<p><strong>Member Code:</strong> ${user.memberCode}</p>` : ''}
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 3px 8px; border-radius: 3px;">${tempPassword}</code></p>
          </div>
          
          <p><strong>Important:</strong> Please log in and change your password as soon as possible.</p>
          <p>Login here: <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="color: #4F46E5;">Login to Trailblazer</a></p>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            If you have any questions, please contact your administrator.
          </p>
        </div>
      `
    });

    if (error) throw new Error(error.message);
    console.log('Welcome email sent:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send event notification to users
 * @param {Array} recipients - Array of user emails
 * @param {Object} event - Event object with title, description, date, location
 */
const sendEventNotification = async (recipients, event) => {
  try {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });

    const { data, error } = await getResend().emails.send({
      from: FROM_ADDRESS(),
      bcc: recipients,
      subject: `New Event: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Event Announcement</h2>
          
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1F2937; margin-top: 0;">${event.title}</h3>
            
            <div style="margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
              ${event.location ? `<p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location}</p>` : ''}
            </div>
            
            ${event.description ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #D1D5DB;">
                <h4 style="margin: 0 0 10px 0;">Description:</h4>
                <p style="margin: 0; line-height: 1.6;">${event.description}</p>
              </div>
            ` : ''}
          </div>
          
          ${event.registrationLink ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${event.registrationLink}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Register Now
              </a>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            This is an automated notification from Trailblazer. For more information, please log in to your account.
          </p>
        </div>
      `
    });

    if (error) throw new Error(error.message);
    console.log('Event notification sent:', data.id);
    return { success: true, messageId: data.id, recipientCount: recipients.length };
  } catch (error) {
    console.error('Error sending event notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {String} email - Recipient email
 * @param {String} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const { data, error } = await getResend().emails.send({
      from: FROM_ADDRESS(),
      to: email,
      subject: 'Password Reset Request - Trailblazer',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #6B7280; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="margin-top: 30px; color: #EF4444; font-size: 14px;">
            <strong>Note:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    });

    if (error) throw new Error(error.message);
    console.log('Password reset email sent:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generic send email utility
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_ADDRESS(),
      to,
      subject,
      html
    });

    if (error) throw new Error(error.message);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendEventNotification,
  sendPasswordResetEmail,
  sendEmail
};
