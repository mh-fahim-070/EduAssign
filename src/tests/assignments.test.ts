import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createAssignmentSchema, updateAssignmentSchema } from '../server/validation.js';

describe('Assignment Validation & Business Rules Unit Tests', () => {
  test('should pass validation for valid assignment parameters', () => {
    const valid = createAssignmentSchema.safeParse({
      title: 'Calculus Midterm Problem Set',
      description: 'Solve problems 1 through 15 in chapter 4.',
      classId: 'cls-101',
      subjectId: 'sbj-math101',
      deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
      maxMarks: 100,
      status: 'Published',
    });

    assert.strictEqual(valid.success, true);
  });

  test('should fail validation when maxMarks is invalid or zero', () => {
    const invalidMarksZero = createAssignmentSchema.safeParse({
      title: 'Calculus Midterm',
      description: 'Solve problems',
      classId: 'cls-101',
      subjectId: 'sbj-math101',
      deadline: new Date().toISOString(),
      maxMarks: 0,
    });
    assert.strictEqual(invalidMarksZero.success, false);

    const invalidMarksNegative = createAssignmentSchema.safeParse({
      title: 'Calculus Midterm',
      description: 'Solve problems',
      classId: 'cls-101',
      subjectId: 'sbj-math101',
      deadline: new Date().toISOString(),
      maxMarks: -10,
    });
    assert.strictEqual(invalidMarksNegative.success, false);

    const invalidMarksExceed = createAssignmentSchema.safeParse({
      title: 'Calculus Midterm',
      description: 'Solve problems',
      classId: 'cls-101',
      subjectId: 'sbj-math101',
      deadline: new Date().toISOString(),
      maxMarks: 1050,
    });
    assert.strictEqual(invalidMarksExceed.success, false);
  });

  test('should fail validation when deadline date string is malformed', () => {
    const invalidDate = createAssignmentSchema.safeParse({
      title: 'Physics Lab Report',
      description: 'Write up lab results',
      classId: 'cls-101',
      subjectId: 'sbj-phys101',
      deadline: 'not-a-valid-date-string',
      maxMarks: 50,
    });

    assert.strictEqual(invalidDate.success, false);
  });
});
