import React from 'react';
import Toast from 'react-native-toast-message';

export class Toaster extends React.Component {
  constructor(props) {
    super(props);
    // this.toast = createRef();
  }

  success(message) {
    if (message && message !== '' && message !== null) {
      Toast.show({
        type: 'success',
        props: { text1:message },
      });
    }
  }


  error(message) {
    if (message && message !== '' && message !== null) {
      Toast.show({
        type: 'error',
        props: { text1: message }
      });
    }
  }

  render() {
    return <></>;
  }
}
