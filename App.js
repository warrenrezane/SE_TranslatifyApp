import React, { Component } from 'react';
import { StatusBar, Text, View, TouchableOpacity, Dimensions, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';

import { RNCamera } from 'react-native-camera';
import Spinner from 'react-native-loading-spinner-overlay';
import Modal from 'react-native-simple-modal';
import RNExitApp from 'react-native-exit-app';
import axios from 'axios';
import { key } from './key';

const API_KEY = key;
const visionApi = 'https://vision.googleapis.com/v1/images:annotate?key=' + API_KEY;
const { width } = Dimensions.get('window');

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      showSpinner: false,
      showModal: false,
      image64: null,
      description: null,
      locale: null
    };
    this.toggleLoader = this.toggleLoader.bind(this);
  }

  componentDidMount() {
    StatusBar.setHidden(true);
  }

  toggleLoader() {
    this.setState({
      showSpinner: !this.state.showSpinner
    });
  }

  takePicture = async function () {
    this.toggleLoader();
    if (this.camera) {
      this.setState({ loading: true });
      const options = { base64: true, fixOrientation: true, width: 720, cropToPreview: true };
      const data = await this.camera.takePictureAsync(options);
      console.log(data.base64.replace(/\n|\r/g, ""));
      axios.post(visionApi, {
        requests: [
          {
            image: {
              content: data.base64.replace(/\n|\r/g, "")
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }],
            imageContext: {
              languageHints: ["en-t-i0-handwrit", "zh-CN", "zh-TW", "ja"]
            }
          }
        ]
      })
        .then((response) => {
          console.log(response);
          const textAnnotations = response.data.responses[0].textAnnotations[0];
          const textContent = textAnnotations.description;
          const detectedLanguage = textAnnotations.locale;
          this.setState({
            description: textContent,
            locale: detectedLanguage
          })
        })
        .catch(error => console.log(error, 'error'));
      this.setState({
        image64: data.base64
      })
      this.setState({
        showSpinner: false,
        loading: false,
        showModal: true
      })
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.title}>
          <TouchableOpacity onPress={this.handleExit.bind(this)}>
            <Image source={require('./assets/exit.png')} style={styles.exitIcon} />
          </TouchableOpacity>
        </View>
        <RNCamera
          ref={(ref) => {
            this.camera = ref;
          }}
          style={styles.preview}
          permissionDialogTitle="Permission to use camera"
          permissionDialogMessage="We need your permission to use your camera phone"
          ratio="1:1"
        />
        <View style={styles.buttonContainer}>
          <View style={styles.cameraButton}>
            <TouchableOpacity onPress={this.takePicture.bind(this)} disabled={this.state.loading}>
              <Image source={require('./assets/capture.png')} style={styles.captureIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SPINNER WHILE CAPTURING IMAGE */}
        <Spinner visible={this.state.showSpinner} />

        {/* MODAL VIEW WHEN DATA BASE64 IS SET */}
        <Modal
          offset={0}
          open={this.state.showModal}
          modalDidOpen={() => { }}
          modalDidClose={() => { }}
          closeOnTouchOutside={false}
          disableOnBackPress={true} >
          <View>
            <View style={styles.modalContainer}>
              <Image source={{ uri: `data:image/jpeg;base64,${this.state.image64}` }} style={{ width: 100, height: 100 }} />
            </View>
            {
              !this.state.description ? <ActivityIndicator style={{ padding: 15 }} size="small" color="#75aaff" /> :
                <View style={{ alignContent: 'center' }}>
                  <Text style={{ fontSize: 15, margin: 10, textAlign: 'center' }}>Detected Language: {`${this.findLanguage(this.state.locale, languageSelection)} | ${this.state.locale}`}</Text>
                  <Text style={{ fontSize: 15, margin: 5, textAlign: 'center' }}>{this.state.description}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={this.cleanUpCamera.bind(this)}>
                    <Text style={{ textAlign: 'center' }}>Close</Text>
                  </TouchableOpacity>
                </View>
            }
          </View>
        </Modal>
      </View>
    );
  }

  cleanUpCamera() {
    this.setState({
      showModal: false,
      image64: null,
      description: null,
      locale: null
    })
  }

  handleExit() {
    Alert.alert(
      'Information',
      'Are you sure want to exit?', [{
        text: 'Cancel',
        style: 'cancel'
      }, {
        text: 'Yes',
        onPress: () => RNExitApp.exitApp()
      },], {
        cancelable: false
      }
    )
  }

  findLanguage(key, langArr) {
    for (let i = 0; i < langArr.length; i++) {
      if (langArr[i].key === key) {
        return langArr[i].language;
      }
    }
    return 'language not yet supported. ';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  rowContainer: {
    flexDirection: 'row'
  },
  captureIcon: {
    width: 60, height: 60
  },
  exitIcon: {
    width: 20,
    height: 20,
  },
  title: {
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  modalContainer: {
    margin: 10,
    alignItems: 'center'
  },
  preview: {
    alignItems: 'center',
    width,
    height: width,
  },
  buttonContainer: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    borderWidth: 6,
    borderColor: '#eaeaea',
    height: 75,
    width: 75,
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 45,
  },
  closeButton: {
    margin: 5,
    backgroundColor: '#e1e9ef',
    padding: 10,
    width: 70,
    borderRadius: 20,
    alignSelf: 'center'
  }
});

// Language Selection here

const languageSelection = [
  {
    key: 'en',
    language: 'English'
  },
  {
    key: 'ja',
    language: 'Japanese'
  },
  {
    key: 'ko',
    language: 'Korean'
  }
]