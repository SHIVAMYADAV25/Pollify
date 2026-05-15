const { z } = require('zod');

const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required').max(200),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(500),
  isMandatory: z.boolean().default(true),
  order: z.number().default(0),
  options: z
    .array(optionSchema)
    .min(2, 'Each question must have at least 2 options')
    .max(10, 'Each question can have at most 10 options'),
});

const createPollSchema = z.object({
  title: z.string().min(1, 'Poll title is required').max(200),
  description: z.string().max(1000).optional().default(''),
  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required')
    .max(20, 'Maximum 20 questions allowed'),
  isAnonymous: z.boolean().default(true),
  expiresAt: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: 'Invalid expiry date' })
    .refine((v) => new Date(v) > new Date(), { message: 'Expiry must be in the future' }),
});

// Express middleware — runs Zod schema, passes first error message to client
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors[0].message;
    return res.status(400).json({ success: false, message });
  }
  req.body = result.data;
  next();
};

module.exports = { createPollSchema, validate };