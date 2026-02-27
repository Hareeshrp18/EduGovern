import * as model from './academic.model.js';

export const getClasses = () => model.findAllClasses();
export const getClassById = (id) => model.findClassById(id);
export const createClass = (data) => model.createClass(data);
export const updateClass = (id, data) => model.updateClass(id, data);
export const deleteClass = (id) => model.deleteClass(id);

export const getSections = (classId) => model.findAllSections(classId);
export const getSectionById = (id) => model.findSectionById(id);
export const createSection = (data) => model.createSection(data);
export const updateSection = (id, data) => model.updateSection(id, data);
export const deleteSection = (id) => model.deleteSection(id);

export const getSubjects = (classId) => model.findAllSubjects(classId);
export const getSubjectById = (id) => model.findSubjectById(id);
export const createSubject = (data) => model.createSubject(data);
export const updateSubject = (id, data) => model.updateSubject(id, data);
export const deleteSubject = (id) => model.deleteSubject(id);

export const getExams = (classId) => model.findAllExams(classId);
export const getExamById = (id) => model.findExamById(id);
export const createExam = (data) => model.createExam(data);
export const updateExam = (id, data) => model.updateExam(id, data);
export const deleteExam = (id) => model.deleteExam(id);
