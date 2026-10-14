export const safeStorage = {
  read(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  write(key, value) {
    try {
      localStorage.setItem(key, value);

      return true;
    } catch {
      return false;
    }
  },

  clear(key) {
    try {
      localStorage.removeItem(key);

      return true;
    } catch {
      return false;
    }
  },
};
