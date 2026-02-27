import * as service from './academic.service.js';

export const getAllClasses = async (req, res) => {
  try {
    const data = await service.getClasses();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const data = await service.getClassById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const data = await service.createClass(req.body);
    res.status(201).json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Class name already exists' });
    }
    if (err.message && err.message.includes('Class cannot be above 12')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const data = await service.updateClass(Number(req.params.id), req.body);
    res.json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Class name already exists' });
    }
    if (err.message && err.message.includes('Class cannot be above 12')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const ok = await service.deleteClass(Number(req.params.id));
    if (!ok) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllSections = async (req, res) => {
  try {
    const classId = req.query.classId ? Number(req.query.classId) : null;
    const data = await service.getSections(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSectionById = async (req, res) => {
  try {
    const data = await service.getSectionById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSection = async (req, res) => {
  try {
    const data = await service.createSection(req.body);
    res.status(201).json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Section name already exists for this class' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const data = await service.updateSection(Number(req.params.id), req.body);
    res.json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Section name already exists for this class' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const ok = await service.deleteSection(Number(req.params.id));
    if (!ok) return res.status(404).json({ success: false, message: 'Section not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const classId = req.query.classId ? Number(req.query.classId) : null;
    const data = await service.getSubjects(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSubjectById = async (req, res) => {
  try {
    const data = await service.getSubjectById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const data = await service.createSubject(req.body);
    res.status(201).json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Subject name already exists for this class' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const data = await service.updateSubject(Number(req.params.id), req.body);
    res.json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Subject name already exists for this class' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const ok = await service.deleteSubject(Number(req.params.id));
    if (!ok) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllExams = async (req, res) => {
  try {
    const classId = req.query.classId ? Number(req.query.classId) : null;
    const data = await service.getExams(classId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const data = await service.getExamById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const data = await service.createExam(req.body);
    res.status(201).json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Exam name already exists for this class' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const data = await service.updateExam(Number(req.params.id), req.body);
    res.json(data);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Exam name already exists for this class' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const ok = await service.deleteExam(Number(req.params.id));
    if (!ok) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
