export default {
  // resolves from test to snapshot path
  resolveSnapshotPath: (testPath: string, snapshotExtension: string) => {
    console.log({ testPath, snapshotExtension });

    return testPath.replace('/dist/', '/src/') + snapshotExtension;
  },

  // resolves from snapshot to test path
  resolveTestPath: (snapshotFilePath: string, snapshotExtension: string) =>
    snapshotFilePath
      .replace('/src/', '/dist/')
      .slice(0, -snapshotExtension.length),

  // Example test path, used for preflight consistency check of the implementation above
  testPathForConsistencyCheck: 'some/dist/example.test.js',
};
