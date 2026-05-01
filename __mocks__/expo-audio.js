module.exports = {
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    record: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
    uri: null,
  })),
  useAudioRecorderState: jest.fn(() => ({
    isRecording: false,
    durationMillis: 0,
    mediaServicesDidReset: false,
  })),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(() =>
      Promise.resolve({ granted: true, status: 'granted' })
    ),
  },
  RecordingPresets: {
    HIGH_QUALITY: {
      extension: '.m4a',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
    },
  },
};
