export const BackgroundFetchResult = {
  NewData: 1,
  Failed: 2,
  NoData: 3,
};
export const registerTaskAsync = jest.fn();
export default { BackgroundFetchResult, registerTaskAsync };
