import { FakeLocationService } from './FakeLocationService';

describe('FakeLocationService — granted', () => {
  let service: FakeLocationService;

  beforeEach(() => {
    service = new FakeLocationService('granted', { latitude: 48.8566, longitude: 2.3522 });
  });

  it('should return granted on requestPermission', async () => {
    const status = await service.requestPermission();
    expect(status).toBe('granted');
  });

  it('should return the configured coords on getCurrentPosition', async () => {
    const coords = await service.getCurrentPosition();
    expect(coords).toEqual({ latitude: 48.8566, longitude: 2.3522 });
  });

  it('should allow updating coords after construction', async () => {
    service = new FakeLocationService('granted', { latitude: 28.4177, longitude: -81.5812 });
    const coords = await service.getCurrentPosition();
    expect(coords).toEqual({ latitude: 28.4177, longitude: -81.5812 });
  });
});

describe('FakeLocationService — denied', () => {
  it('should return denied on requestPermission', async () => {
    const service = new FakeLocationService('denied');
    const status = await service.requestPermission();
    expect(status).toBe('denied');
  });

  it('should return null on getCurrentPosition when denied', async () => {
    const service = new FakeLocationService('denied');
    const coords = await service.getCurrentPosition();
    expect(coords).toBeNull();
  });
});

describe('FakeLocationService — undetermined', () => {
  it('should return undetermined on requestPermission', async () => {
    const service = new FakeLocationService('undetermined');
    const status = await service.requestPermission();
    expect(status).toBe('undetermined');
  });

  it('should return null on getCurrentPosition when undetermined', async () => {
    const service = new FakeLocationService('undetermined');
    const coords = await service.getCurrentPosition();
    expect(coords).toBeNull();
  });
});

describe('FakeLocationService — error', () => {
  it('should throw on requestPermission when configured with error', async () => {
    const service = new FakeLocationService('error');
    await expect(service.requestPermission()).rejects.toThrow();
  });

  it('should throw on getCurrentPosition when configured with error', async () => {
    const service = new FakeLocationService('error');
    await expect(service.getCurrentPosition()).rejects.toThrow();
  });
});
