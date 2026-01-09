import Constants from 'expo-constants';

export const isUpdateNeeded = (minVersion: string): boolean => {
  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  if (!minVersion) return false;

  const v1parts = currentVersion.split('.').map(Number);
  const v2parts = minVersion.split('.').map(Number);

  for (let i = 0; i < v1parts.length; ++i) {
    if (v2parts.length === i) return false;

    if (v1parts[i] === v2parts[i]) {
      continue;
    } else if (v1parts[i] > v2parts[i]) {
      return false;
    } else {
      return true;
    }
  }

  if (v1parts.length !== v2parts.length) {
    return false;
  }

  return false;
};
