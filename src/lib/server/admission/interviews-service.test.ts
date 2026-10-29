import { describe, it, expect } from "bun:test";
import {
  listInterviews,
  createOrUpdateSlot,
  updateSlot,
  deleteSlot,
  saveDocState,
  addWaitlistEntry,
  removeWaitlistEntry,
  listDocTypes,
  addOrUpdateDocType,
  deleteDocType,
  resetDocTypes,
} from "./interviews-service";

describe("Admission Interviews Service", () => {
  const testAppId = `test_app_${Date.now()}`;

  it("creates and persists a new interview slot", async () => {
    const slot = await createOrUpdateSlot({
      appId: testAppId,
      applicantName: "Muhammad Abdullah",
      applicantNameUrdu: "محمد عبد اللہ",
      refNo: "APP-2026-TEST",
      system: "school",
      categoryOrClass: "Class 5",
      source: "public",
      date: "2026-11-05",
      time: "10:30",
      interviewer: "Maulana Imran Hussain",
      room: "Conference Room A",
      status: "scheduled",
    });

    expect(slot).toBeDefined();
    expect(slot.appId).toBe(testAppId);
    expect(slot.status).toBe("scheduled");
    expect(slot.interviewer).toBe("Maulana Imran Hussain");

    const data = await listInterviews();
    const found = data.slots.find((s) => s.appId === testAppId);
    expect(found).toBeDefined();
    expect(found?.date).toBe("2026-11-05");
  });

  it("updates an existing interview slot with passed, failed, and marks", async () => {
    const data = await listInterviews();
    const existing = data.slots.find((s) => s.appId === testAppId);
    expect(existing).toBeDefined();

    if (existing) {
      // Test passed status with marks and notes
      const passedSlot = await updateSlot(existing.id, {
        status: "passed",
        marks: 88,
        notes: "Passed entrance interview successfully",
      });
      expect(passedSlot).toBeDefined();
      expect(passedSlot?.status).toBe("passed");
      expect(passedSlot?.marks).toBe(88);
      expect(passedSlot?.notes).toBe("Passed entrance interview successfully");

      // Test failed status
      const failedSlot = await updateSlot(existing.id, {
        status: "failed",
        marks: 40,
        notes: "Did not meet criteria",
      });
      expect(failedSlot).toBeDefined();
      expect(failedSlot?.status).toBe("failed");
      expect(failedSlot?.marks).toBe(40);

      // Restore to completed
      const completedSlot = await updateSlot(existing.id, {
        status: "completed",
        marks: 90,
      });
      expect(completedSlot?.status).toBe("completed");
    }
  });

  it("persists document verification state across calls", async () => {
    await saveDocState(testAppId, {
      bform: true,
      cnic: true,
      photos: false,
    });

    const data = await listInterviews();
    expect(data.docStates[testAppId]).toBeDefined();
    expect(data.docStates[testAppId].bform).toBe(true);
    expect(data.docStates[testAppId].cnic).toBe(true);
    expect(data.docStates[testAppId].photos).toBe(false);

    // update photos to true
    await saveDocState(testAppId, { photos: true });
    const refreshed = await listInterviews();
    expect(refreshed.docStates[testAppId].photos).toBe(true);
    expect(refreshed.docStates[testAppId].bform).toBe(true);
  });

  it("manages customizable document types checklist", async () => {
    // 1. Get initial document types
    const initial = await listDocTypes();
    expect(Array.isArray(initial)).toBe(true);
    expect(initial.length).toBeGreaterThanOrEqual(5);

    // 2. Add or update a new custom document
    const customKey = `vaccination_cert_${Date.now()}`;
    const updated = await addOrUpdateDocType({
      key: customKey,
      en: "Vaccination Record",
      ur: "حفاظتی ٹیکہ جات کا ریکارڈ",
      required: false,
    });
    expect(updated.some((d) => d.key === customKey)).toBe(true);
    const customDoc = updated.find((d) => d.key === customKey);
    expect(customDoc?.en).toBe("Vaccination Record");
    expect(customDoc?.required).toBe(false);

    // 3. Edit the custom document to be required
    const edited = await addOrUpdateDocType({
      key: customKey,
      en: "Vaccination Certificate (Updated)",
      ur: "ویکسین سرٹیفکیٹ",
      required: true,
    });
    const editedDoc = edited.find((d) => d.key === customKey);
    expect(editedDoc?.en).toBe("Vaccination Certificate (Updated)");
    expect(editedDoc?.required).toBe(true);

    // 4. Delete the custom document
    const afterDelete = await deleteDocType(customKey);
    expect(afterDelete.some((d) => d.key === customKey)).toBe(false);

    // 5. Reset to defaults
    const reset = await resetDocTypes();
    expect(reset.length).toBe(7);
    expect(reset.some((d) => d.key === "bform")).toBe(true);
  });

  it("adds to waitlist and removes/promotes", async () => {
    const entry = await addWaitlistEntry(testAppId, 2, "Awaiting section opening");
    expect(entry).toBeDefined();
    expect(entry.appId).toBe(testAppId);
    expect(entry.rank).toBe(2);

    let data = await listInterviews();
    expect(data.waitlist.some((w) => w.appId === testAppId)).toBe(true);

    await removeWaitlistEntry(testAppId);
    data = await listInterviews();
    expect(data.waitlist.some((w) => w.appId === testAppId)).toBe(false);
  });

  it("deletes an interview slot", async () => {
    const data = await listInterviews();
    const existing = data.slots.find((s) => s.appId === testAppId);
    if (existing) {
      const success = await deleteSlot(existing.id);
      expect(success).toBe(true);

      const after = await listInterviews();
      expect(after.slots.some((s) => s.id === existing.id)).toBe(false);
    }
  });
});


