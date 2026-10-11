export const STORAGE_KEY = 'xisu-student-card-v1';
export const MAJORS = ['大数据管理与应用', '审计学', '会计学', '工商管理', '会计学(ACCA)', '工商管理(CIMA)'];
export const STEPS = [
  { title: '基本信息', short: '基本', description: '从认识你开始。请按证件和学校通知填写，姓名与身份证信息需保持一致。', mark: '01' },
  { title: '家庭信息', short: '家庭', description: '仔细核对家庭地址与家长信息。奖励和处分如无，可保留空白。', mark: '02' },
  { title: '本地联系人', short: '联系', description: '需要填写本地联系人的外地学生，可使用对应辅导员的信息。', mark: '03' },
  { title: '本人简历', short: '简历', description: '从小学填起，按时间顺序填写。高中证明人一般写高中老师，大学填辅导员。', mark: '04' },
  { title: '直系亲属', short: '亲属', description: '填写直系亲属主要社会关系，核对称呼、姓名及工作单位或任职。', mark: '05' },
  { title: '核对预览', short: '核对', description: '先检查格式，再请老师当面核对。确认无误后，照着预览填写纸质学籍卡。', mark: '06' }
];
const field = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
export const GROUPS = [
  [
    field('name', '姓名', 'text', { required: true, placeholder: '与身份证一致的姓名', autocomplete: 'name' }),
    field('studentId', '学号', 'text', { required: true, placeholder: '按学校通知填写，保留前导零' }),
    field('examId', '考号', 'text', { placeholder: '按原始高考材料填写，保留前导零', inputmode: 'numeric', hint: '此处与档案审查表的考生号共用，请核对高考考号。' }),
    field('college', '所在学院', 'text', { placeholder: '填写学院完整名称' }),
    field('major', '专业', 'select', { required: true, options: MAJORS, hint: '请使用专业全称，不要填写简称。' }),
    field('className', '所在班', 'text', { required: true, placeholder: '按学校通知填写班级', hint: '请使用本班老师通知的统一名称。' }),
    field('gender', '性别', 'select', { options: ['男', '女'] }),
    field('birthDate', '出生日期', 'date', { required: true }),
    field('idNumber', '身份证号', 'text', { required: true, placeholder: '18位身份证号，末位可为 X', wide: true, maxlength: 18 }),
    field('enrollmentMonth', '入学年月', 'month', { required: true }),
    field('origin', '生源地', 'text', { placeholder: '如：陕西省渭南市合阳县', hint: '填写到县、区或县级市；直辖市如：北京市海淀区。' }),
    field('ethnicity', '民族', 'text', { placeholder: '如：汉族' }),
    field('politics', '政治面貌', 'select', { options: ['群众', '共青团员'] }),
    field('health', '健康状况', 'text', { placeholder: '如：良好、一般；按实际填写', suggestions: ['良好', '一般'] }),
    field('religion', '宗教', 'text', { placeholder: '如无宗教信仰，请填“无”' }),
    field('educationMode', '办学形式', 'text', { readonly: true, hint: '学校统一填写：全日制。培养层次为本科。' }),
    field('skills', '特长', 'text', { placeholder: '根据实际情况填写' }),
    field('filledDate', '填表时间', 'date')
  ],
  [
    field('familyAddress', '家庭详细地址', 'textarea', { wide: true, placeholder: '省、市、区县、街道及详细门牌等' }),
    field('familyPostal', '家庭邮编', 'text', { placeholder: '6位数字', inputmode: 'numeric', maxlength: 6 }),
    field('parentName', '家长姓名'), field('parentRelation', '与自己关系', 'text', { placeholder: '如：父子、母女' }),
    field('parentEmployer', '家长单位', 'text', { placeholder: '按实际情况填写' }),
    field('parentRole', '家长职务'),
    field('parentPostal', '单位邮编', 'text', { placeholder: '6位数字', inputmode: 'numeric', maxlength: 6 }),
    field('parentPhone', '单位电话', 'tel', { placeholder: '手机号码或带区号的固定电话' }),
    field('residence', '侨居地', 'textarea', { wide: true, hint: '纸卡说明：指学生家庭在非户口所在地的住址。' }),
    field('awards', '何时何地因何种原因受过何种奖励', 'textarea', { wide: true, placeholder: '如无，可留空', optional: true }),
    field('punishments', '何时何地因何种原因受过何种处分', 'textarea', { wide: true, placeholder: '如无，可留空', optional: true })
  ],
  [
    field('contactName', '联系人姓名'), field('contactRelation', '与联系人关系'),
    field('contactPhone', '联系人电话', 'tel', { placeholder: '按本班辅导员通知填写', hint: '公开版不提供辅导员电话，请以班级通知为准。' }),
    field('contactPostal', '联系人邮编', 'text', { inputmode: 'numeric', maxlength: 6 }),
    field('contactAddress', '联系人地址', 'textarea', { wide: true })
  ]
];
export const ALL_FIELDS = GROUPS.flat();
export const SUBJECT_TYPES = ['文史', '理工', '综合改革', '艺文', '艺理'];
export const ARCHIVE_STEPS = [
  { title: '基本信息填写', short: '基本信息', description: '按本班统一通知填写专业和班级。重点核对考生号，生源地具体填写到县或区。', mark: '01' },
  { title: '核对预览', short: '核对预览', description: '核对学生基本信息。档案审查结论、签字和盖章区域留给老师在纸表中完成。', mark: '02' }
];
export const ARCHIVE_FIELDS = ['college', 'major', 'className', 'examId', 'idNumber', 'name', 'origin', 'gender'].map(key => ({
  ...ALL_FIELDS.find(f => f.key === key), required: true,
  ...(key === 'college' ? { label: '学院' } : key === 'className' ? { label: '班级' } : key === 'examId' ? { label: '考生号（高考考号）', wide: true, hint: '请逐位对照原始高考材料，切勿误填学号或其他号码。' } : {})
})).concat(field('subjectType', '科类', 'select', { required: true, options: SUBJECT_TYPES }));
export const COUNSELORS = {
  ma: { name: '马佳音', phone: '', email: '' },
  zhang: { name: '张琦敏', phone: '', email: '' }
};
export function counselorFor(major) {
  if (!MAJORS.includes(major)) return null;
  return ['大数据管理与应用', '审计学'].includes(major) ? COUNSELORS.zhang : COUNSELORS.ma;
}
export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function rowId() { return globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function newResume(stage = '') { return { id: rowId(), stage, start: '', end: '', ongoing: stage === '大学', organization: '', witness: '' }; }
export function newRelative() { return { id: rowId(), relation: '', name: '', employment: '' }; }
export function createDraft(now = new Date()) {
  return { schemaVersion: 2, updatedAt: null, activeDocument: 'student', archiveReview: { subjectType: '' }, fields: Object.fromEntries(ALL_FIELDS.map(f => [f.key, f.key === 'filledDate' ? localDate(now) : f.key === 'educationMode' ? '全日制' : f.key === 'college' ? '商学院' : ''])), contactNeeded: '', resume: ['小学', '初中', '高中', '大学'].map(newResume), relatives: [newRelative()] };
}
export function contactDefaults(major) {
  const counselor = counselorFor(major);
  if (!counselor) return {};
  return { contactName: counselor.name, contactPhone: counselor.phone, contactRelation: '师生', contactPostal: '710128', contactAddress: '陕西省西安市西安外国语大学长安校区' };
}
export function updateCounselor(draft, previousMajor) {
  const previous = contactDefaults(previousMajor);
  const next = contactDefaults(draft.fields.major);
  const retained = [];
  if (draft.contactNeeded === 'yes') for (const [key, value] of Object.entries(next)) {
    if (!draft.fields[key] || draft.fields[key] === previous[key]) draft.fields[key] = value;
    else if (draft.fields[key] !== value) retained.push(key);
  }
  const previousName = counselorFor(previousMajor)?.name;
  const nextName = counselorFor(draft.fields.major)?.name;
  if (nextName) for (const row of draft.resume) if (row.stage === '大学') {
    if (!row.witness || row.witness === previousName) row.witness = nextName;
    else if (row.witness !== nextName) retained.push(`resume.${row.id}.witness`);
  }
  return retained;
}
export function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (y < 1800 || m < 1 || m > 12 || d < 1) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
export function isMonth(value) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1800; }
export function identityInfo(value) {
  const id = value.trim().toUpperCase();
  if (!/^\d{17}[\dX]$/.test(id)) return { valid: false, message: '请输入18位身份证号，最后一位可为 X。' };
  const birthday = `${id.slice(6, 10)}-${id.slice(10, 12)}-${id.slice(12, 14)}`;
  if (!isDate(birthday)) return { valid: false, message: '身份证号中的出生日期不存在，请核对。' };
  if (!/^[1-9]\d{5}$/.test(id.slice(0, 6)) || id.slice(14, 17) === '000') return { valid: false, message: '身份证号的地址码或顺序码格式有误，请核对。' };
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const sum = weights.reduce((total, weight, i) => total + weight * Number(id[i]), 0);
  if ('10X98765432'[sum % 11] !== id[17]) return { valid: false, message: '身份证号校验码不匹配，请逐位核对原证件。' };
  return { valid: true, birthday, gender: Number(id[16]) % 2 ? '男' : '女' };
}
export function isPhone(value) {
  const phone = value.trim().replace(/[\s（）()－—]/g, '').replace(/^\+86/, '');
  return /^1\d{10}$/.test(phone) || /^0\d{2,3}-?\d{7,8}(?:-\d{1,6})?$/.test(phone);
}
export function validateDraft(draft, now = new Date()) {
  const issues = [];
  const today = localDate(now), currentMonth = today.slice(0, 7);
  const add = (key, message, severity = 'error', step) => issues.push({ key, message, severity, step: step ?? GROUPS.findIndex(group => group.some(f => f.key === key)) });
  for (const metadata of ALL_FIELDS) {
    const { key, label, required, optional } = metadata;
    if (GROUPS[2].includes(metadata) && draft.contactNeeded !== 'yes') continue;
    const value = draft.fields[key].trim();
    if (!value) {
      if (required) add(key, `请填写${label}。`);
      else if (!optional) add(key, `${label}尚未填写，请核对是否需要填写。`, 'warning');
      continue;
    }
    if (metadata.type === 'date') {
      if (!isDate(value)) add(key, `${label}不是有效日期。`);
      else if (value > today) add(key, `${label}不能晚于今天。`);
    }
    if (metadata.type === 'month') {
      if (!isMonth(value)) add(key, `${label}不是有效年月。`);
      else if (value > currentMonth) add(key, `${label}晚于当前月份，请确认学校通知。`, 'warning');
    }
    if (key.toLowerCase().includes('postal') && !/^\d{6}$/.test(value)) add(key, `${label}应为6位数字。`);
    if (metadata.type === 'tel' && !isPhone(value)) add(key, `${label}应为11位手机号码，或带区号的固定电话。`);
    if (metadata.options && !metadata.options.includes(value)) add(key, `请重新选择${label}。`);
  }
  const identity = draft.fields.idNumber.trim() ? identityInfo(draft.fields.idNumber) : null;
  if (identity && !identity.valid) add('idNumber', identity.message);
  if (identity?.valid) {
    if (identity.birthday > today) add('idNumber', '身份证号中的出生日期不能晚于今天。');
    if (draft.fields.birthDate && identity.birthday !== draft.fields.birthDate) add('birthDate', '出生日期与身份证号不一致，请核对。', 'warning');
    if (draft.fields.gender && identity.gender !== draft.fields.gender) add('gender', '性别与身份证号不一致，请核对。', 'warning');
  }
  if (isDate(draft.fields.birthDate) && isMonth(draft.fields.enrollmentMonth) && draft.fields.enrollmentMonth <= draft.fields.birthDate.slice(0, 7)) add('enrollmentMonth', '入学年月应晚于出生年月。');
  if (!draft.contactNeeded) add('contactNeeded', '请确认是否需要填写本地联系人。', 'warning', 2);
  const activeResume = draft.resume.filter(row => row.start || row.end || row.organization || row.witness);
  if (!activeResume.length) add('resume', '本人简历尚未填写，请从小学填起。', 'warning', 3);
  let previousEnd = '';
  for (const row of activeResume) {
    const prefix = `resume.${row.id}`;
    for (const [key, label] of [['start', '自何年何月'], ['organization', '学校、单位或任职'], ['witness', '证明人']]) if (!row[key].trim()) add(`${prefix}.${key}`, `简历${row.stage ? `（${row.stage}）` : ''}缺少${label}。`, 'warning', 3);
    for (const key of ['start', 'end']) {
      if (key === 'end' && row.ongoing) continue;
      if (row[key] && !isMonth(row[key])) add(`${prefix}.${key}`, '简历年月格式不正确。', 'error', 3);
      else if (row[key] > currentMonth) add(`${prefix}.${key}`, '简历年月晚于当前月份，请确认。', 'warning', 3);
    }
    if (!row.end && !row.ongoing) add(`${prefix}.end`, '请填写简历结束年月，或选择“至今”。', 'warning', 3);
    if (isMonth(row.start) && isDate(draft.fields.birthDate) && row.start < draft.fields.birthDate.slice(0, 7)) add(`${prefix}.start`, '简历开始年月早于出生年月，请核对。', 'warning', 3);
    if (isMonth(row.start) && isMonth(row.end) && !row.ongoing && row.start > row.end) add(`${prefix}.end`, '简历结束年月不能早于开始年月。', 'error', 3);
    if (previousEnd && row.start && row.start < previousEnd) add(`${prefix}.start`, '这段简历与上一段时间重叠，请核对顺序。', 'warning', 3);
    previousEnd = row.ongoing ? currentMonth : row.end;
  }
  const relatives = draft.relatives.filter(row => row.relation || row.name || row.employment);
  if (!relatives.length) add('relatives', '直系亲属信息尚未填写，请核对。', 'warning', 4);
  for (const row of relatives) for (const [key, label] of [['relation', '称呼'], ['name', '姓名'], ['employment', '工作单位或任职']]) {
    if (!row[key].trim()) add(`relatives.${row.id}.${key}`, `亲属信息缺少${label}。`, 'warning', 4);
  }
  return issues;
}
export function originNeedsReview(value) {
  const origin = value.trim();
  if (/^(北京市|天津市|上海市|重庆市).+(区|县)$/.test(origin)) return false;
  if (/(省|自治区).+(市|自治州|地区|盟).+(区|县|市|旗)$/.test(origin)) return false;
  return true;
}
export function validateArchiveReview(draft, confirmation = '', now = new Date()) {
  const issues = [];
  const add = (key, message, severity = 'error') => issues.push({ key, message, severity, step: 0 });
  for (const metadata of ARCHIVE_FIELDS) {
    const value = metadata.key === 'subjectType' ? draft.archiveReview.subjectType : draft.fields[metadata.key];
    if (!value.trim()) add(metadata.key, `请填写${metadata.label}。`);
    else if (metadata.options && !metadata.options.includes(value)) add(metadata.key, `请重新选择${metadata.label}。`);
  }
  const candidate = draft.fields.examId.trim();
  if (candidate && !/^\d+$/.test(candidate)) add('examId', '考生号仅应包含数字，请核对原始高考材料。');
  if (!confirmation.trim()) add('examConfirmation', '请再次输入考生号，并逐位核对原始高考材料。');
  else if (candidate !== confirmation.trim()) add('examConfirmation', '两次考生号不一致，请核对后重新输入。');
  const identity = draft.fields.idNumber.trim() ? identityInfo(draft.fields.idNumber) : null;
  if (identity && !identity.valid) add('idNumber', identity.message);
  if (identity?.valid) {
    if (identity.birthday > localDate(now)) add('idNumber', '身份证号中的出生日期不能晚于今天。');
    if (draft.fields.gender && draft.fields.gender !== identity.gender) add('gender', '性别与身份证号不一致，请核对。', 'warning');
  }
  if (draft.fields.origin.trim() && originNeedsReview(draft.fields.origin)) add('origin', '请核对生源地是否已写到县、区或县级市；特殊地区按实际情况填写。', 'warning');
  return issues;
}
export function chineseDate(value) {
  if (!value) return '';
  if (!/^\d{4}-\d{2}(?:-\d{2})?$/.test(value)) return value;
  const parts = value.split('-');
  return `${parts[0]}年${parts[1] ? Number(parts[1]) + '月' : ''}${parts[2] ? Number(parts[2]) + '日' : ''}`;
}
export function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export function normalizeDraft(value, now = new Date()) {
  if (!value || ![1, 2].includes(value.schemaVersion) || !value.fields || !Array.isArray(value.resume) || !Array.isArray(value.relatives)) throw new Error('草稿格式无法识别');
  const draft = createDraft(now);
  for (const metadata of ALL_FIELDS) if (typeof value.fields[metadata.key] === 'string') draft.fields[metadata.key] = value.fields[metadata.key];
  draft.fields.educationMode = '全日制';
  if (!draft.fields.college.trim()) draft.fields.college = '商学院';
  draft.activeDocument = value.activeDocument === 'archive' ? 'archive' : 'student';
  if (typeof value.archiveReview?.subjectType === 'string') draft.archiveReview.subjectType = value.archiveReview.subjectType;
  draft.contactNeeded = ['yes', 'no', ''].includes(value.contactNeeded) ? value.contactNeeded : '';
  draft.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : null;
  const cleanRows = (rows, factory, keys) => {
    const ids = new Set();
    return rows.map(input => {
      if (!input || typeof input !== 'object') throw new Error('草稿记录损坏');
      const row = factory();
      if (typeof input.id === 'string' && /^[\w-]+$/.test(input.id) && !ids.has(input.id)) row.id = input.id;
      ids.add(row.id);
      for (const key of keys) if (typeof input[key] === 'string') row[key] = input[key];
      if ('ongoing' in row) row.ongoing = input.ongoing === true;
      return row;
    });
  };
  draft.resume = cleanRows(value.resume, newResume, ['stage', 'start', 'end', 'organization', 'witness']);
  draft.relatives = cleanRows(value.relatives, newRelative, ['relation', 'name', 'employment']);
  return draft;
}
export function loadDraft(storage, now = new Date()) {
  try { const raw = storage.getItem(STORAGE_KEY); return { draft: raw ? normalizeDraft(JSON.parse(raw), now) : createDraft(now), restored: !!raw, error: null }; }
  catch (error) { return { draft: createDraft(now), restored: false, error: `本机草稿无法读取：${error.message}。当前填写仍可继续，原草稿不会自动覆盖。` }; }
}
export function saveDraft(storage, draft, now = new Date()) {
  const updatedAt = now.toISOString();
  try { storage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, updatedAt })); draft.updatedAt = updatedAt; return { ok: true, updatedAt }; }
  catch { return { ok: false, message: '草稿保存失败，请保留此页面并及时打印或核对。检查浏览器是否允许本地存储。' }; }
}
