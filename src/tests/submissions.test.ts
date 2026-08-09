import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { submitAssignmentSchema, gradeSubmissionSchema } from '../server/validation.js';

describe('Submission & Grading Business Rules Unit Tests', () => {
  test('should validate submission payload', () => {
    const valid = submitAssignmentSchema.safeParse({
      assignmentId: 'asg-1',
      content: 'Here is my completed assignment essay on modern calculus principles.',
    });
    assert.strictEqual(valid.success, true);

    const emptyContent = submitAssignmentSchema.safeParse({
      assignmentId: 'asg-1',
      content: '',
    });
    assert.strictEqual(emptyContent.success, false);
  });

  test('should validate grading payload boundaries', () => {
    const validGrading = gradeSubmissionSchema.safeParse({
      marks: 95,
      feedback: 'Excellent work! Great logical structure.',
      status: 'Reviewed',
    });
    assert.strictEqual(validGrading.success, true);

    const negativeMarks = gradeSubmissionSchema.safeParse({
      marks: -5,
      feedback: 'Needs work',
    });
    assert.strictEqual(negativeMarks.success, false);

    const marksExceedingLimit = gradeSubmissionSchema.safeParse({
      marks: 1500,
      feedback: 'Bonus points awarded',
    });
    assert.strictEqual(marksExceedingLimit.success, false);
  });
});
