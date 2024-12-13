module.exports = logger;

const { body, param } = require('express-validator');

exports.scheduleInterview = [
    body('applicationId').isMongoId().withMessage('Invalid application ID'),
    body('scheduledAt').isISO8601().withMessage('Invalid date format'),
    body('interviewType')
        .isIn(['ONLINE', 'OFFLINE', 'PHONE'])
        .withMessage('Invalid interview type'),
    body('location')
        .if(body('interviewType').equals('OFFLINE'))
        .notEmpty()
        .withMessage('Location is required for offline interviews'),
    body('meetingLink')
        .if(body('interviewType').equals('ONLINE'))
        .isURL()
        .withMessage('Valid meeting link is required for online interviews')
];

exports.updateInterviewStatus = [
    param('interviewId').isMongoId().withMessage('Invalid interview ID'),
    body('status')
        .isIn(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'PENDING'])
        .withMessage('Invalid status')
];

exports.interviewFeedback = [
    param('interviewId').isMongoId().withMessage('Invalid interview ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('technicalScore').optional().isInt({ min: 0, max: 100 }).withMessage('Technical score must be between 0 and 100'),
    body('communicationScore').optional().isInt({ min: 0, max: 100 }).withMessage('Communication score must be between 0 and 100'),
    body('comment').optional().isString().trim().notEmpty().withMessage('Invalid comment')
];