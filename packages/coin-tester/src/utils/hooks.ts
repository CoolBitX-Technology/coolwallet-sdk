interface Props {
  setIsLocked(locked: boolean): void;
}

const useRequest = async <P extends Props>(request: () => Promise<string>, props: P): Promise<string> => {
  props.setIsLocked(true);
  try {
    return request();
  } catch (error: any) {
    return error.message;
  } finally {
    props.setIsLocked(false);
  }
};

export { useRequest };
