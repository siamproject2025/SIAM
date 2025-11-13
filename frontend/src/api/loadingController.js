let setLoadingGlobal;

export const loadingController = {
  register(setLoading) {
    setLoadingGlobal = setLoading;
  },
  start() {
    if (setLoadingGlobal) setLoadingGlobal(true);
  },
  stop() {
    if (setLoadingGlobal) setLoadingGlobal(false);
  },
};
