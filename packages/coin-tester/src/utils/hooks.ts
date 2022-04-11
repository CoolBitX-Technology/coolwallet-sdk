interface Props {
  setIsLocked(locked: boolean): void;
}

const useAppId = () => {
  const appId = localStorage.getItem('appId');
  if (!appId) throw new Error('No Appid stored, please register!');
  return appId;
};

const useRequest = async <P extends Props>(request: () => Promise<string>, props: P): Promise<string> => {
  props.setIsLocked(true);
  try {
    const response = await request();
    return response;
  } catch (error: any) {
    console.error(error);
    return error.message;
  } finally {
    props.setIsLocked(false);
  }
};

export { useRequest, useAppId };
