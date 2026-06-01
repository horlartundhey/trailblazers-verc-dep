const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');
const { sendEmail } = require('../utils/emailService');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContact = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, phone, email, subject, message } = req.body;

    const contact = new Contact({
      name,
      phone,
      email,
      subject,
      message
    });

    await contact.save();

    // Send notification email to admin
    try {
      const submittedAt = new Date().toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'thetrailblazersnation@gmail.com',
        subject: `📬 New Message: ${subject}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Contact Message</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">TrailBlazers Nation</h1>
              <p style="margin:8px 0 0;color:#c7d2fe;font-size:13px;letter-spacing:1px;text-transform:uppercase;">New Contact Form Submission</p>
            </td>
          </tr>

          <!-- Alert Banner -->
          <tr>
            <td style="background-color:#EEF2FF;padding:16px 40px;border-left:4px solid #4F46E5;">
              <p style="margin:0;color:#3730a3;font-size:14px;">
                📬 &nbsp;Someone has sent a message through your website's contact form.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">

              <!-- Sender Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding-bottom:6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Sender</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="28" style="vertical-align:top;padding-top:2px;">
                          <div style="width:24px;height:24px;background-color:#EEF2FF;border-radius:50%;text-align:center;line-height:24px;font-size:13px;">👤</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827;">${name}</p>
                          <p style="margin:0 0 2px;font-size:13px;color:#4F46E5;">${email || 'No email provided'}</p>
                          ${phone ? `<p style="margin:0;font-size:13px;color:#6B7280;">📞 ${phone}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Subject -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding-bottom:6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Subject</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;">
                    <p style="margin:0;font-size:15px;font-weight:600;color:#1F2937;">${subject}</p>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding-bottom:6px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Message</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;">
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.CLIENT_URL || 'https://trailblazers-verc-client.vercel.app'}/admin/dashboard"
                       style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.3px;">
                      View in Admin Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                Received on ${submittedAt}
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#9CA3AF;">
                TrailBlazers Nation &mdash; <a href="${process.env.CLIENT_URL || 'https://trailblazers-verc-client.vercel.app'}" style="color:#6366F1;text-decoration:none;">trailblazersnation.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: {
        id: contact._id
      }
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message
    });
  }
};

// @desc    Get all contact submissions
// @route   GET /api/contact
// @access  Private (Admin)
exports.getAllContacts = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const contacts = await Contact.find(query)
      .populate('respondedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submissions',
      error: error.message
    });
  }
};

// @desc    Get single contact submission
// @route   GET /api/contact/:id
// @access  Private (Admin)
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('respondedBy', 'name email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    // Mark as read if unread
    if (contact.status === 'Unread') {
      contact.status = 'Read';
      await contact.save();
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact submission',
      error: error.message
    });
  }
};

// @desc    Update contact submission
// @route   PATCH /api/contact/:id
// @access  Private (Admin)
exports.updateContact = async (req, res) => {
  try {
    const { status, response } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    if (status) {
      contact.status = status;
    }

    if (response) {
      contact.response = response;
      contact.status = 'Responded';
      contact.respondedBy = req.user.id;
      contact.respondedAt = new Date();

      // Send response email
      try {
        await sendEmail({
          to: contact.email,
          subject: `Re: ${contact.subject}`,
          html: `
            <h2>Response to Your Inquiry</h2>
            <p>Dear ${contact.name},</p>
            <p>Thank you for contacting Trailblazers Nation. Here is our response to your inquiry:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #6366f1; margin: 20px 0;">
              <p><strong>Your Message:</strong></p>
              <p>${contact.message}</p>
            </div>
            <div style="margin: 20px 0;">
              <p><strong>Our Response:</strong></p>
              <p>${response}</p>
            </div>
            <p>Best regards,<br>Trailblazers Nation Team</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send response email:', emailError);
      }
    }

    await contact.save();

    res.json({
      success: true,
      message: 'Contact submission updated successfully',
      data: contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact submission',
      error: error.message
    });
  }
};

// @desc    Delete contact submission
// @route   DELETE /api/contact/:id
// @access  Private (Admin)
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    await contact.deleteOne();

    res.json({
      success: true,
      message: 'Contact submission deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact submission',
      error: error.message
    });
  }
};
