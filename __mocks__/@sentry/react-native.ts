// Mock for @sentry/react-native — no-op in tests with spy support

const mockInit = jest.fn();
const mockWrap = jest.fn((component: any) => component);
const mockCaptureException = jest.fn();
const mockCaptureMessage = jest.fn();
const mockSetUser = jest.fn();
const mockSetTag = jest.fn();
const mockSetExtra = jest.fn();
const mockAddBreadcrumb = jest.fn();

export const init = mockInit;
export const wrap = mockWrap;
export const captureException = mockCaptureException;
export const captureMessage = mockCaptureMessage;
export const setUser = mockSetUser;
export const setTag = mockSetTag;
export const setExtra = mockSetExtra;
export const addBreadcrumb = mockAddBreadcrumb;

const Sentry = {
  init: mockInit,
  wrap: mockWrap,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setUser: mockSetUser,
  setTag: mockSetTag,
  setExtra: mockSetExtra,
  addBreadcrumb: mockAddBreadcrumb,
};
export default Sentry;
