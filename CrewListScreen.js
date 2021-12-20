import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  Image,
  SectionList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  NativeModules,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import ActionSheet from 'react-native-actionsheet';
import { connect } from 'react-redux';
import { Tooltip } from 'react-native-elements';
import { captureRef } from 'react-native-view-shot';
import CameraRoll from '@react-native-community/cameraroll';
import moment from 'moment';

import { SwitchButtonGroup } from '../../components/index';
import {
  ListItemSeparatorCrewList,
  ListItemSeparatorWithoutSpace,
} from '../../components/ListItemSeparator';
import { colors } from '../../configs';
import { HOME_STACK } from '../../configs/routeNames';
import { scale, verticalScale, getWidth } from '../../helper/ScreenHelper';
import { getCurrentTextSize } from '../../helper/TextSizeHelper';
import commonStyles from '../../styles';
import {
  CATHAY_EMAIL_ADDRESS,
  DRAGON_EMAIL_ADDRESS,
} from '../../helper/EmailHelper';
import {
  EMAIL_TYPE_LIST,
  LEGENDS_MAP,
  OPERATING_CREW_RANK_CODE,
} from '../../configs/constants';
import StickyBar from '../../components/StickyBar';
import { getDir, removeFilePrefix } from '../../utils/fileUtils';
import { showAlert, showAlertWithCustom } from '../../helper/AlertHelper';
import layout from '../../styles/layout';
import { logViewCommon } from '../../actions/logger.actions';
import {
  acknowledgeCrewPos,
  changePA,
  updateISMViewVersion,
} from '../../helper/APICallHelper';
import {
  updateCrewPosStatus,
  updateIsmViewVersion,
} from '../../databases/flightInfoFunction';
import {
  updateCrewPosConfirmAction,
  updatePaChangeAction,
  updateIsmViewPositionVersion,
} from '../../actions/common.actions';
import {
  getCrewPaChangeList,
  updateCrewPaChange,
} from '../../databases/flightInfoFunction';
import CrewStationView from '../../components/CrewStationView';

const FpImageManager = NativeModules.FpImageManager;

const sendingIcon = require('../../assets/images/loading.png');
const successIcon = require('../../assets/images/tick.png');
const failIcon = require('../../assets/images/alert.png');

const closeIcon = require('../../assets/images/close_grey.png');
const swapIcon = require('../../assets/images/swap.png');
const dotsIcon = require('../../assets/images/dots.png');
const nationalityIcon = require('../../assets/images/nationality.png');
const feedBackIcon = require('../../assets/images/feedback.png');

const deselectIcon = require('../../assets/images/deselect.png');
const selectIcon = require('../../assets/images/selected.png');
const hotelIcon = require('../../assets/images/crew_hotel.png');
const hotelHomeIcon = require('../../assets/images/hotel_home.png');

const paIcon = require('../../assets/images/PA.png');

const TOTAL_COUNT = 'TOTAL_COUNT';

const HEADER_ICON_MAP = {
  M: require('../../assets/images/male-default.png'),
  'M-Me': require('../../assets/images/male-selected.png'),
  'M-Leader-F': require('../../assets/images/male-leader-f.png'),
  'M-Me-Leader-F': require('../../assets/images/male-me-leader-f.png'),
  'M-Leader-J': require('../../assets/images/male-leader-j.png'),
  'M-Me-Leader-J': require('../../assets/images/male-me-leader-j.png'),
  'M-Leader-Y': require('../../assets/images/male-leader-y.png'),
  'M-Me-Leader-Y': require('../../assets/images/male-me-leader-y.png'),

  F: require('../../assets/images/female-default.png'),
  'F-Me': require('../../assets/images/female-selected.png'),
  'F-Leader-F': require('../../assets/images/female-leader-f.png'),
  'F-Me-Leader-F': require('../../assets/images/female-me-leader-f.png'),
  'F-Leader-J': require('../../assets/images/female-leader-j.png'),
  'F-Me-Leader-J': require('../../assets/images/female-me-leader-j.png'),
  'F-Leader-Y': require('../../assets/images/female-leader-y.png'),
  'F-Me-Leader-Y': require('../../assets/images/female-me-leader-y.png'),
};

const CABIN_CLASS_COLOR_MAP = {
  F: colors.cabinClass.fcl,
  J: colors.cabinClass.jcl,
  Y: colors.cabinClass.ycl,
};

const mapStateToProps = state => {
  return {
    fontSizeKey: state.authState.userSettings.fontSizeKey,
    galacxyId: state.authState.galacxyId,
    flightInfo: state.flightInfoState.flightInfo,
    flightInfoSearch: state.searchFlightState.flightInfo,
    rosters: state.rosterState.rosters,
  };
};

class CrewListScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    console.log('terryterry....  I am CrewListScreen navigationOptions');

    const isEmailMode = navigation.getParam('isEmailMode', false);
    const isEditPosMode = navigation.getParam('isEditPosMode', false);
    const isEditPAMode = navigation.getParam('isEditPAMode', false);

    const isEditPosShowDone = navigation.getParam('isEditPosShowDone', false);
    const isSelectedAll = navigation.getParam('isSelectedAll', false);
    const isEditPAShowDone = navigation.getParam('isEditPAShowDone', false);

    const styles = getStyles();

    const emailModeView = {
      headerRight: (
        <TouchableOpacity
          onPress={
            !isSelectedAll
              ? navigation.getParam('selectAllClicked')
              : navigation.getParam('deSelectAllClicked')
          }
        >
          <Text style={styles.titleStyle}>
            {!isSelectedAll ? 'Select All' : 'Deselect All'}
          </Text>
        </TouchableOpacity>
      ),
      headerLeft: (
        <TouchableOpacity onPress={navigation.getParam('cancelClicked')}>
          <Text style={styles.titleStyle}>Cancel</Text>
        </TouchableOpacity>
      ),
    };

    const normalView = {
      headerRight: (
        <TouchableOpacity onPress={navigation.getParam('actionSheetClicked')}>
          <Image
            source={dotsIcon}
            style={{
              marginRight: scale(8),
            }}
          />
        </TouchableOpacity>
      ),
    };

    const editPosModeView = {
      headerLeft: (
        <TouchableOpacity
          style={{
            marginLeft: scale(8),
            width: scale(32),
            height: scale(32),
          }}
          onPress={navigation.getParam('positionChangeCancelClicked')}
        >
          <Image source={closeIcon} style={styles.titleImageStyle} />
        </TouchableOpacity>
      ),
    };

    if (isEditPosShowDone) {
      editPosModeView.headerRight = (
        <TouchableOpacity onPress={navigation.getParam('editPosDoneClicked')}>
          <Text style={styles.titleStyle}>Done</Text>
        </TouchableOpacity>
      );
    }

    const editPAModeView = {
      headerLeft: (
        <TouchableOpacity
          style={{
            marginLeft: scale(8),
            width: scale(32),
            height: scale(32),
          }}
          onPress={navigation.getParam('paChangeCancelClicked')}
        >
          <Image source={closeIcon} style={styles.titleImageStyle} />
        </TouchableOpacity>
      ),
    };

    if (isEditPAShowDone) {
      editPAModeView.headerRight = (
        <TouchableOpacity onPress={navigation.getParam('editPADoneClicked')}>
          <Text style={styles.titleStyle}>Done</Text>
        </TouchableOpacity>
      );
    }

    let headerLeftRight;
    if (
      (isEmailMode && isEditPosMode && isEditPAMode) ||
      (!isEditPosMode && !isEmailMode && !isEditPAMode)
    ) {
      headerLeftRight = normalView;
    } else if (isEmailMode) {
      headerLeftRight = emailModeView;
    } else if (isEditPosMode) {
      headerLeftRight = editPosModeView;
    } else if (isEditPAMode) {
      headerLeftRight = editPAModeView;
    }

    return {
      headerTitle: (
        <StickyBar
          getRootRef={navigation.getParam('setStickyBarRef')}
          customTitle={'My Crew List'}
        />
      ),
      ...headerLeftRight,
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      selectedCrewTypeIndex: 0,
      emailList: [],
      viewMoreList: [],
      swapList: [],
      swapCacheList: [],
      paChange: [],
      isSubmitting: false,
      submitSuccess: null,
      submitFail: '',
      ismHasView: false,
      viewMorePassenger: false,
    };

    this._crewListRef = null;
    this._stickyBarRef = null;
    this._secondCrewListRef = null;
    this._secondCrewListRef2 = null;

    this._focusListener = null;

    this.spinValue = new Animated.Value(0);

    this.rotate = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  }

  async componentDidMount() {
    console.log('terryterry.... CrewListScreen componentDidMount');

    // update last ISM view version
    this.updateLastISMViewVersion();

    this.props.navigation.setParams({
      setStickyBarRef: this._setStickyBarRef,
      actionSheetClicked: this._actionSheetClicked,

      cancelClicked: this._cancelClicked,
      positionChangeCancelClicked: this._positionChangeCancelClicked,
      paChangeCancelClicked: this._paChangeCancelClicked,

      selectAllClicked: this._selectAllClicked,
      deSelectAllClicked: this._deSelectAllClicked,
      editPosDoneClicked: this._editPosDoneClicked,
      editPADoneClicked: this._editPADoneClicked,

      isSelectedAll: false,
      isEmailMode: false,
      tabBarVisible: true,
      isEditPosMode: false,
      isEditPosShowDone: false,
      isEditPAMode: false,
      isEditPAShowDone: false,
    });

    this._focusListener = this.props.navigation.addListener('didFocus', () => {
      console.log('crewlist didFocus');

      if (this._secondCrewListRef) {
        this._secondCrewListRef._wrapperListRef._listRef.scrollToEnd();
      }
    });
    const isHome = this.props.navigation.state.routeName.includes(HOME_STACK);

    this.props.logViewCommon('Crew_List', isHome);
    console.log('terryterry.... CrewListScreen componentDidMount completed');

    this.spin();
  }

  updateLastISMViewVersion = async () => {
    console.log('updateLastISMViewVersion');

    let flightInfo;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      flightInfo = this.props.flightInfo;
    } else {
      flightInfo = this.props.flightInfoSearch;
    }

    if (flightInfo && flightInfo.isIsmAccess) {
      const result = await updateISMViewVersion(
        flightInfo.airlineCode,
        flightInfo.flightNumber.padStart(4, '0'),
        flightInfo.flightDate,
        flightInfo.origin,
        flightInfo.destination,
        this.props.galacxyId,
        flightInfo.crewPosId,
      );

      if (result.state === 'success') {
        this.setState({ ismHasView: true });
      }
    }
  };

  updateLocalLastISMViewVersion() {
    console.log('updateLocalLastISMViewVersion');
    if (this.state.ismHasView) {
      let flightInfo = {};
      if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
        flightInfo = this.props.flightInfo;
      } else {
        flightInfo = this.props.flightInfoSearch;
      }
      updateIsmViewVersion(
        flightInfo.airlineCode,
        flightInfo.flightNumber,
        flightInfo.flightDate,
        flightInfo.origin,
      );
      this.props.updateIsmViewPositionVersion();
    }
  }

  _viewPassenger = () => {
    if (this.state.viewMorePassenger) {
      this.setState({ viewMorePassenger: false });
    } else {
      this.setState({ viewMorePassenger: true });
    }
  };

  spin() {
    this.spinValue.setValue(0);
    Animated.timing(this.spinValue, {
      toValue: 1,
      duration: 750,
      easing: Easing.linear,
    }).start(() => this.spin());
  }

  _onLayout = e => {
    // const layout = e.nativeEvent.layout;
    console.log('terryterry _onLayout');
    console.log(layout);
  };

  componentWillUnmount() {
    // Remove the event listener
    this._focusListener.remove();
    // update local last ISM view Version
    this.updateLocalLastISMViewVersion();
  }

  getFlightInfo = () => {
    let flightInfo = null;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      flightInfo = this.props.flightInfo;
    } else {
      flightInfo = this.props.flightInfoSearch;
    }

    return {
      airlineCode: flightInfo.airlineCode,
      flightNumber: flightInfo.flightNumber,
      flightDate: flightInfo.flightDate,
      origin: flightInfo.origin,
      destination: flightInfo.destination,
      aircraftType: flightInfo.aircraftType,
      showBaseport: flightInfo.showBaseport,
      flightDateDisplay: flightInfo.flightDateDisplay,
      crews: flightInfo.crews,
      transformedCrews: flightInfo.transformedCrews,
      operatingCrews: flightInfo.operatingCrews,
      scheduleDepartureTimeLocal: flightInfo.scheduleDepartureTimeLocal,
      flightDateYYYYMMDD: flightInfo.flightDateYYYYMMDD,
    };
  };

  calculateDutyStart = ({
    airlineCode,
    aircraftType,
    scheduleDepartureTimeLocal,
    origin,
  }) => {
    const now = moment();
    const m = moment(scheduleDepartureTimeLocal, 'YYYY-MM-DD HH:mm:ss');

    if (origin === 'HKG') {
      if (airlineCode === 'CX') {
        m.subtract(80, 'minutes');
        return now.isSameOrAfter(m);
      } else {
        if (!aircraftType) {
          return false;
        }
        if (aircraftType.startsWith('33')) {
          m.subtract(80, 'minutes');
        } else if (aircraftType.startsWith('32')) {
          m.subtract(70, 'minutes');
        }
        return now.isSameOrAfter(m);
      }
    } else {
      if (!aircraftType) {
        return false;
      }
      m.subtract(60, 'minutes');
      return now.isSameOrAfter(m);
    }
  };

  _onContentSizeChange = (width, height) => {
    console.log(`_onContentSizeChange width: ${width} height:${height}`);
    this.setState({
      width: width,
      height: height,
    });
  };

  _onContentSizeChange2 = (width, height) => {
    console.log(`_onContentSizeChange2 width: ${width} height:${height}`);

     this.setState({
       width2: width,
       height2: height,
     });

    this.setState(
      prev => {
        return {
          ...prev,
          width2: width,
          height2: height,
        };
      },
      () => {
        setTimeout(() => {
          if (this._secondCrewListRef) {
            console.log('about to move second crew list...');
            this._secondCrewListRef._wrapperListRef._listRef.scrollToEnd();
          }
        }, 100);
      },
    );
  };

  _onContentSizeChange3 = (width, height) => {
    console.log(`_onContentSizeChange3 width: ${width} height:${height}`);

    this.setState(
      prev => {
        return {
          ...prev,
          width3: width,
          height3: height,
        };
      },
      () => {
        setTimeout(() => {
          if (this._secondCrewListRef2) {
            console.log('about to move second crew list...');
            this._secondCrewListRef2._wrapperListRef._listRef.scrollToEnd();
          }
        }, 100);
      },
    );
  };

  _setStickyBarRef = el => {
    console.log('terryterry _setStickyBarRef');
    this._stickyBarRef = el;
  };

  _setCrewListRef = el => (this._crewListRef = el);

  _setSecondCrewListRef = el => (this._secondCrewListRef = el);
  _setSecondCrewListRef2 = el => (this._secondCrewListRef2 = el);

  _captureScreen = () => {
    this._secondCrewListRef.forceUpdate(() => {
      if (this._secondCrewListRef2 !== null) {
        // handle screen capture
        this._secondCrewListRef2.forceUpdate(() => {
          console.log('terry finish forceUpdate ...');
          setTimeout(async () => {
            console.log('i am in timeout');
            await this._confirmCaptureScreen();
          }, 200);
        });
      } else {
        console.log('terry finish forceUpdate ...');
        setTimeout(async () => {
          console.log('i am in timeout');
          await this._confirmCaptureScreen();
        }, 200);
      }
    });
  };

  _confirmCaptureScreen = async () => {
    console.log('terryterry _captureScreen at ' + new Date().toISOString());
    try {
      console.log('taking uri1 ...');

      const uri1 = await captureRef(this._stickyBarRef, {
        format: 'jpg',
        quality: 0.8,
      });

      console.log('taking uri2 ...');

      const crewListRef = this._secondCrewListRef;

      const uri2 = await captureRef(crewListRef, {
        format: 'jpg',
        quality: 0.8,
        snapshotContentContainer: true,
      });

      // handle screen capture
      const crewListRef2 = this._secondCrewListRef2;
      var uri3 = '';
      if (this._secondCrewListRef2 !== null) {
        uri3 = await captureRef(crewListRef2, {
          format: 'jpg',
          quality: 0.8,
          snapshotContentContainer: true,
        });
      }

      console.log('terryterry uri1 ' + uri1);
      console.log('terryterry uri2 ' + uri2);

      const {
        airlineCode,
        flightNumber,
        flightDate,
        origin,
      } = this.getFlightInfo();
      const fdate = flightDate.replace(/-/g, '');
      const ts = new Date().getTime();
      const destFileName = `CREWS_${fdate}${airlineCode}${flightNumber}${origin}_${ts}.jpg`;

      if (Platform.OS === 'ios') {
        const tempDest = getDir(uri1) + destFileName;
        const destPath = await FpImageManager.concatImages(
          uri1,
          uri2,
          tempDest,
        );

        // handle screen capture
        var destPath2 = destPath;
        if (this._secondCrewListRef2 !== null) {
          destPath2 = await FpImageManager.concatImages(
            destPath,
            uri3,
            tempDest,
          );
        }

        const result = await CameraRoll.saveToCameraRoll(destPath2);
        console.log('terry CameraRoll result' + result);
        showAlert(
          'Capture Successfully',
          'Please find the crew list image in Photos',
        );
      } else {
        console.log('android');
        await FpImageManager.concatImages(
          removeFilePrefix(uri1),
          removeFilePrefix(uri2),
          destFileName,
        );
        showAlert(
          'Capture Successfully',
          'Please find crew list image in Download',
        );
      }
    } catch (err) {
      console.log('_captureScreen err ' + err);
      showAlert('Capture Failed', 'Error Message: ' + err.toString());
    }
  };

  _onSendEmailClicked = () => {
    let toEmailList = this.state.emailList.map(r => {
      let emailSuffix = CATHAY_EMAIL_ADDRESS;
      if (r.galacxyId && r.galacxyId.startsWith('HDA')) {
        emailSuffix = DRAGON_EMAIL_ADDRESS;
      }
      const toEmailAddress = r.galacxyId + emailSuffix;

      return { ...r, email: toEmailAddress };
    });

    const flightInfo = this.getFlightInfo();
    this.props.navigation.navigate('EmailModal', {
      toEmailList,
      emailType: EMAIL_TYPE_LIST.CREW_LIST_MESSAGE,
      ...flightInfo,
    });
  };

  _onSwapClicked = () => {
    let swapCacheList = this.state.swapCacheList;
    const swapList = this.state.swapList;

    const firstCrew = swapCacheList.find(
      x => x.galacxyId === swapList[0].galacxyId,
    );

    const secondCrew = swapCacheList.find(
      x => x.galacxyId === swapList[1].galacxyId,
    );

    let changePosition;
    let alertString = '';

    if (firstCrew && secondCrew) {
      // check rankCode
      const firstRankCode = swapList[0].rankCode;
      const secondRankCode = swapList[1].rankCode;
      const firstPositionRankCode = firstCrew.toPositionRankCode;
      const secondPositionRankCode = secondCrew.toPositionRankCode;

      const firstRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstRankCode,
      );
      const secondRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondRankCode,
      );
      const firstPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstPositionRankCode,
      );
      const secondPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondPositionRankCode,
      );

      // check cabin qualification
      const firstCabins = swapList[0].cabinQualification;
      const secondCabins = swapList[1].cabinQualification;
      const firstWorkingCabins = firstCrew.toWorkingCabins;
      const secondWorkingCabins = secondCrew.toWorkingCabins;

      if (
        secondPositionRankCodeIndex !== -1 && // target position rank code exist
        (firstRankCodeIndex === -1 || // origin position rank code not exist
          firstRankCodeIndex - secondPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[0].badgeName} has not been trained to work as ${secondPositionRankCode}.\n`;
      }

      if (secondWorkingCabins.length > 0) {
        let tempArray = secondWorkingCabins.filter(
          x => !firstCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[0].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      if (
        firstPositionRankCodeIndex !== -1 && // target position rank code exist
        (secondRankCodeIndex === -1 || // origin position rank code not exist
          secondRankCodeIndex - firstPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[1].badgeName} has not been trained to work as ${firstPositionRankCode}.\n`;
      }

      if (firstWorkingCabins.length > 0) {
        let tempArray = firstWorkingCabins.filter(
          x => !secondCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[1].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      changePosition = () => {
        const firstIndex = swapCacheList.indexOf(firstCrew);
        const secondIndex = swapCacheList.indexOf(secondCrew);
        const toCache = firstCrew.to;
        const cabinCache = firstCrew.cabin;
        const isSectionLeaderCache = firstCrew.isSectionLeader;
        const crewStationCache = firstCrew.crewStation;
        const positionRankCodeCache = firstCrew.toPositionRankCode;
        const workingCabinsCache = firstCrew.toWorkingCabins;
        swapCacheList[firstIndex].to = secondCrew.to;
        swapCacheList[firstIndex].cabin = secondCrew.cabin;
        swapCacheList[firstIndex].isSectionLeader = secondCrew.isSectionLeader;
        swapCacheList[firstIndex].crewStation = secondCrew.crewStation;
        swapCacheList[firstIndex].toPositionRankCode =
          secondCrew.toPositionRankCode;
        swapCacheList[firstIndex].toWorkingCabins = secondCrew.toWorkingCabins;
        swapCacheList[secondIndex].to = toCache;
        swapCacheList[secondIndex].cabin = cabinCache;
        swapCacheList[secondIndex].isSectionLeader = isSectionLeaderCache;
        swapCacheList[secondIndex].crewStation = crewStationCache;
        swapCacheList[secondIndex].toPositionRankCode = positionRankCodeCache;
        swapCacheList[secondIndex].toWorkingCabins = workingCabinsCache;
        swapCacheList = swapCacheList.filter(x => x.from !== x.to);

        this.setState({
          swapList: [],
          swapCacheList,
        });
        const isShowDone = swapCacheList.length > 0;
        this.props.navigation.setParams({
          isEditPosShowDone: isShowDone,
        });
      };
    } else if (firstCrew) {
      // check rankCode
      const firstRankCode = swapList[0].rankCode;
      const secondRankCode = swapList[1].rankCode;
      const firstPositionRankCode = firstCrew.toPositionRankCode;
      const secondPositionRankCode = swapList[1].positionRankCode;

      const firstRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstRankCode,
      );
      const secondRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondRankCode,
      );
      const firstPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstPositionRankCode,
      );
      const secondPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondPositionRankCode,
      );

      // check cabin qualification
      const firstCabins = swapList[0].cabinQualification;
      const secondCabins = swapList[1].cabinQualification;
      const firstWorkingCabins = firstCrew.toWorkingCabins;
      const secondWorkingCabins = swapList[1].workingCabins;

      if (
        secondPositionRankCodeIndex !== -1 && // target position rank code exist
        (firstRankCodeIndex === -1 || // origin position rank code not exist
          firstRankCodeIndex - secondPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[0].badgeName} has not been trained to work as ${secondPositionRankCode}.\n`;
      }

      if (secondWorkingCabins.length > 0) {
        let tempArray = secondWorkingCabins.filter(
          x => !firstCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[0].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      if (
        firstPositionRankCodeIndex !== -1 && // target position rank code exist
        (secondRankCodeIndex === -1 || // origin position rank code not exist
          secondRankCodeIndex - firstPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[1].badgeName} has not been trained to work as ${firstPositionRankCode}.\n`;
      }

      if (firstWorkingCabins.length > 0) {
        let tempArray = firstWorkingCabins.filter(
          x => !secondCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[1].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      changePosition = () => {
        swapCacheList.push({
          galacxyId: swapList[1].galacxyId,
          ern: swapList[1].ern,
          from: swapList[1].position,
          to: firstCrew.to,
          toPositionRankCode: firstCrew.toPositionRankCode,
          toWorkingCabins: firstCrew.toWorkingCabins,
          cabin: firstCrew.cabin,
          isSectionLeader: firstCrew.isSectionLeader,
          crewStation: firstCrew.crewStation,
        });
        const index = swapCacheList.indexOf(firstCrew);
        swapCacheList[index].to = swapList[1].position;
        swapCacheList[index].toPositionRankCode = swapList[1].positionRankCode;
        swapCacheList[index].toWorkingCabins = swapList[1].workingCabins;
        swapCacheList[index].cabin = swapList[1].cabin;
        swapCacheList[index].isSectionLeader = swapList[1].isSectionLeader;
        swapCacheList[index].crewStation = swapList[1].crewStation;
        swapCacheList = swapCacheList.filter(x => x.from !== x.to);

        this.setState({ swapList: [], swapCacheList });
        const isShowDone = swapCacheList.length > 0;
        this.props.navigation.setParams({
          isEditPosShowDone: isShowDone,
        });
      };
    } else if (secondCrew) {
      // check rankCode
      const firstRankCode = swapList[0].rankCode;
      const secondRankCode = swapList[1].rankCode;
      const firstPositionRankCode = swapList[0].positionRankCode;
      const secondPositionRankCode = secondCrew.toPositionRankCode;

      const firstRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstRankCode,
      );
      const secondRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondRankCode,
      );
      const firstPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstPositionRankCode,
      );
      const secondPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondPositionRankCode,
      );

      // check cabin qualification
      const firstCabins = swapList[0].cabinQualification;
      const secondCabins = swapList[1].cabinQualification;
      const firstWorkingCabins = swapList[0].workingCabins;
      const secondWorkingCabins = secondCrew.toWorkingCabins;

      if (
        secondPositionRankCodeIndex !== -1 && // target position rank code exist
        (firstRankCodeIndex === -1 || // origin position rank code not exist
          firstRankCodeIndex - secondPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[0].badgeName} has not been trained to work as ${secondPositionRankCode}.\n`;
      }

      if (secondWorkingCabins.length > 0) {
        let tempArray = secondWorkingCabins.filter(
          x => !firstCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[0].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      if (
        firstPositionRankCodeIndex !== -1 && // target position rank code exist
        (secondRankCodeIndex === -1 || // origin position rank code not exist
          secondRankCodeIndex - firstPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[1].badgeName} has not been trained to work as ${firstPositionRankCode}.\n`;
      }

      if (firstWorkingCabins.length > 0) {
        let tempArray = firstWorkingCabins.filter(
          x => !secondCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[1].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      changePosition = () => {
        swapCacheList.push({
          galacxyId: swapList[0].galacxyId,
          ern: swapList[0].ern,
          from: swapList[0].position,
          to: secondCrew.to,
          toPositionRankCode: secondCrew.toPositionRankCode,
          toWorkingCabins: secondCrew.toWorkingCabins,
          cabin: secondCrew.cabin,
          isSectionLeader: secondCrew.isSectionLeader,
          crewStation: secondCrew.crewStation,
        });
        const index = swapCacheList.indexOf(secondCrew);
        swapCacheList[index].to = swapList[0].position;
        swapCacheList[index].toPositionRankCode = swapList[0].positionRankCode;
        swapCacheList[index].toWorkingCabins = swapList[0].workingCabins;
        swapCacheList[index].cabin = swapList[0].cabin;
        swapCacheList[index].isSectionLeader = swapList[0].isSectionLeader;
        swapCacheList[index].crewStation = swapList[0].crewStation;
        swapCacheList = swapCacheList.filter(x => x.from !== x.to);

        this.setState({ swapList: [], swapCacheList });
        const isShowDone = swapCacheList.length > 0;
        this.props.navigation.setParams({
          isEditPosShowDone: isShowDone,
        });
      };
    } else {
      // check rankCode
      const firstRankCode = swapList[0].rankCode;
      const secondRankCode = swapList[1].rankCode;
      const firstPositionRankCode = swapList[0].positionRankCode;
      const secondPositionRankCode = swapList[1].positionRankCode;

      const firstRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstRankCode,
      );
      const secondRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondRankCode,
      );
      const firstPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        firstPositionRankCode,
      );
      const secondPositionRankCodeIndex = OPERATING_CREW_RANK_CODE.indexOf(
        secondPositionRankCode,
      );

      // check cabin qualification
      const firstCabins = swapList[0].cabinQualification;
      const secondCabins = swapList[1].cabinQualification;
      const firstWorkingCabins = swapList[0].workingCabins;
      const secondWorkingCabins = swapList[1].workingCabins;

      if (
        secondPositionRankCodeIndex !== -1 && // target position rank code exist
        (firstRankCodeIndex === -1 || // origin position rank code not exist
          firstRankCodeIndex - secondPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[0].badgeName} has not been trained to work as ${secondPositionRankCode}.\n`;
      }

      if (secondWorkingCabins.length > 0) {
        let tempArray = secondWorkingCabins.filter(
          x => !firstCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[0].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      if (
        firstPositionRankCodeIndex !== -1 && // target position rank code exist
        (secondRankCodeIndex === -1 || // origin position rank code not exist
          secondRankCodeIndex - firstPositionRankCodeIndex > 0) // both index are exist, difference above 0
      ) {
        // alert
        alertString =
          alertString +
          `${swapList[1].badgeName} has not been trained to work as ${firstPositionRankCode}.\n`;
      }

      if (firstWorkingCabins.length > 0) {
        let tempArray = firstWorkingCabins.filter(
          x => !secondCabins.includes(x),
        );
        if (tempArray.length > 0) {
          //alert
          tempArray = tempArray.map(x => `${x.replace('N', 'New ')}CL`);
          alertString =
            alertString +
            `${
              swapList[1].badgeName
            } has not been trained to work in ${tempArray.join(',')}.\n`;
        }
      }

      changePosition = () => {
        swapCacheList.push({
          galacxyId: swapList[0].galacxyId,
          ern: swapList[0].ern,
          from: swapList[0].position,
          to: swapList[1].position,
          toPositionRankCode: swapList[1].positionRankCode,
          toWorkingCabins: swapList[1].workingCabins,
          cabin: swapList[1].cabin,
          isSectionLeader: swapList[1].isSectionLeader,
          crewStation: swapList[1].crewStation,
        });
        swapCacheList.push({
          galacxyId: swapList[1].galacxyId,
          ern: swapList[1].ern,
          from: swapList[1].position,
          to: swapList[0].position,
          toPositionRankCode: swapList[0].positionRankCode,
          toWorkingCabins: swapList[0].workingCabins,
          cabin: swapList[0].cabin,
          isSectionLeader: swapList[0].isSectionLeader,
          crewStation: swapList[0].crewStation,
        });
        swapCacheList = swapCacheList.filter(x => x.from !== x.to);

        this.setState({ swapList: [], swapCacheList });
        const isShowDone = swapCacheList.length > 0;
        this.props.navigation.setParams({
          isEditPosShowDone: isShowDone,
        });
      };
    }

    if (alertString.length > 0) {
      alertString = alertString + 'Are you sure to proceed?';
      showAlertWithCustom(
        'Unqualified position',
        alertString,
        'Cancel',
        'Proceed',
        changePosition,
      );
    } else {
      changePosition();
    }
  };

  renderListItem = ({ item, index, section }) => {
    const styles = getStyles(this.props.fontSizeKey);

    if (section.title === TOTAL_COUNT) {
      return (
        <View style={styles.headerStyle}>
          <Text style={styles.headerText}>{section.data[0]}</Text>
        </View>
      );
    }

    const isEditPosMode = this.props.navigation.getParam(
      'isEditPosMode',
      false,
    );

    const isEditPAMode = this.props.navigation.getParam('isEditPAMode', false);

    if (
      isEditPosMode &&
      (item.position === 'ISM' ||
        item.position === 'SCCM' ||
        section.title.includes('COCKPIT') ||
        item.isAdditional)
    ) {
      return null;
    }

    if (isEditPAMode && section.title.includes('COCKPIT')) {
      return null;
    }

    const specialDutyCodeText = item.specialDutyCode
      ? item.specialDutyCode
      : '';

    /*
    console.log(JSON.stringify(item));

    output:
    {"badgeName":"UFAK","crewName":"UFAK ZDE","galacxyId":"CCAXUCZ","rankCode":"SP","position":null,"specialDutyCode":"","sex":"F","lang":[],"langLevel":[],"nationality":"KR","category":"USPWN","ced":"2018-11-27","specialMeal":"ML-RVML","specialMealEffDate":"2017-05-01","currentErn":"506984E","isPA":false,"isShowEmailFunction":false,"id":"a3e4296d-8131-410b-b10c-28cddb678987","airlineCode":"CX","flightNumber":"632","flightDate":"2019-02-16","origin":"MAA","language":"","isCurrentUser":false}

    */

    let isIsmAccess = false;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      isIsmAccess = this.props.flightInfo && this.props.flightInfo.isIsmAccess;
    } else {
      isIsmAccess =
        this.props.flightInfoSearch && this.props.flightInfoSearch.isIsmAccess;
    }

    const isMySelf = item.galacxyId === this.props.galacxyId;

    const isEmailMode = this.props.navigation.getParam('isEmailMode', false);

    const isSelected = this.state.emailList.find(
      x => x.galacxyId === item.galacxyId,
    );

    const isEditSelected = this.state.swapList.find(
      x => x.galacxyId === item.galacxyId,
    );

    const swapCacheList = this.state.swapCacheList;

    const positionChangeCrew = swapCacheList.find(
      x => x.galacxyId === item.galacxyId,
    );

    let ismViewPosChange;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      ismViewPosChange =
        this.props.flightInfo && this.props.flightInfo.ismViewPosChange;
    } else {
      ismViewPosChange =
        this.props.flightInfoSearch &&
        this.props.flightInfoSearch.ismViewPosChange;
    }

    let positionChangeCrewForIsm;
    if (isIsmAccess && ismViewPosChange && ismViewPosChange.length > 0) {
      positionChangeCrewForIsm = ismViewPosChange.find(
        x => x.galacxyId === item.galacxyId,
      );
    }

    const isEditPAChange = this.state.paChange.find(
      x => x.ern === item.currentErn,
    );

    const paChangeLang = isEditPAChange ? isEditPAChange.changeList : undefined;

    const isViewMore = this.state.viewMoreList.find(
      x => x.galacxyId === item.galacxyId,
    );

    const flightInfo = this.getFlightInfo();

    let isDutyStart = false;
    const rosterFound = this.props.rosters.find(
      roster =>
        roster.airlineCode === flightInfo.airlineCode &&
        roster.flightNumber === flightInfo.flightNumber &&
        roster.flightDate === flightInfo.flightDateYYYYMMDD &&
        roster.origin === flightInfo.origin,
    );
    if (rosterFound) {
      isDutyStart = moment().isSameOrAfter(
        moment(rosterFound.dutyStartTimeLocal, 'YYYY-MM-DD HH:mm:ss'),
      );
    } else {
      isDutyStart = this.calculateDutyStart(flightInfo);
    }

    const departurePortHotel = item.departurePortHotel
      ? item.departurePortHotel
      : undefined;
    const arrivalPortHotel = item.arrivalPortHotel
      ? item.arrivalPortHotel
      : undefined;

    const checkHotelIsHome = (crewBasePort, stationCode, location) => {
      return (
        (location === stationCode && crewBasePort === stationCode) ||
        // special checking for LHR port
        (crewBasePort === 'LON' && stationCode === 'LHR' && location === 'LHR')
      );
    };

    const emailView = (
      <TouchableOpacity
        onPress={() => this._updateSelectedCrewListForEmail(item, index)}
        style={{
          height: scale(32),
          width: scale(32),
        }}
      >
        <Image
          source={isSelected ? selectIcon : deselectIcon}
          style={styles.titleImageStyle}
        />
      </TouchableOpacity>
    );

    const nameView = () => {
      const badgeNameFontWeight = isMySelf ? 'bold' : '500';
      const crewNameFontWeight = isMySelf ? '500' : 'normal';
      return (
        <View style={styles.flexContainer}>
          <Text>
            <Text
              style={[
                styles.badgeNameText,
                {
                  fontWeight: badgeNameFontWeight,
                },
              ]}
            >
              {item.badgeName}
            </Text>
            <Text
              style={[
                styles.crewNameText,
                styles.flexContainer,
                {
                  fontWeight: crewNameFontWeight,
                },
              ]}
            >
              {`  (${item.crewName})`}
            </Text>
          </Text>
        </View>
      );
    };

    const rankCedNationalityView = (
      <View style={styles.flexRowItemCenterContainer}>
        <Text style={styles.cedText}>{item.category}</Text>
        {item.ced && (
          <Text style={[styles.cedText, { marginLeft: scale(8) }]}>
            {item.ced}
          </Text>
        )}
        <View
          style={[
            styles.flexRowItemCenterContainer,
            styles.flexJustContentCenter,
          ]}
        >
          <Image source={nationalityIcon} style={styles.icon} />
          <Text style={styles.middleText}>{item.nationality || 'unknown'}</Text>
        </View>
      </View>
    );

    const baseView = (
      <View style={styles.flexRowItemCenterContainer}>
        {isIsmAccess && flightInfo.showBaseport && (
          <Text style={styles.cedText}>{`${item.baseport} base`}</Text>
        )}
      </View>
    );

    const isShowEditPA = isEditPAMode && isEditPAChange;

    let paText;

    const paTextStyle = isShowEditPA ? { color: colors.white } : null;

    if (isShowEditPA) {
      if (paChangeLang && paChangeLang.length > 0) {
        paText = paChangeLang.join(',');
      } else if (item.isPA) {
        paText =
          item.paLang && item.paLang.length > 0 ? item.paLang.join(',') : 'CT';
        paTextStyle.textDecorationLine = 'line-through';
      } else {
        paText = undefined;
      }
    } else if (item.isPA) {
      paText =
        item.paLang && item.paLang.length > 0 ? item.paLang.join(',') : 'CT';
    } else {
      paText = undefined;
    }

    const isShowPA = (isShowEditPA && paText) || item.isPA;

    const languagePaBDEView = (
      <View style={styles.flexRowItemCenterContainer}>
        <Image
          source={feedBackIcon}
          style={[styles.icon, { marginLeft: -scale(5) }]}
        />
        <Text style={styles.middleText}>{item.language || 'unknown'}</Text>

        {isShowPA && (
          <View
            style={[
              styles.flexRowItemCenterContainer,
              {
                borderRadius: scale(2),
                backgroundColor: isShowEditPA
                  ? colors.warmBlue
                  : colors.highLightGrey,
                paddingRight: scale(4),
                marginLeft: scale(4),
              },
            ]}
          >
            <Image source={paIcon} style={[styles.icon]} />
            <Text style={[styles.middleText, paTextStyle]}>{paText}</Text>
          </View>
        )}

        {item.isBarSalesEmbargo && (
          <Text
            style={[
              styles.cedText,
              {
                borderRadius: scale(2),
                backgroundColor: colors.highLightGrey,
                paddingLeft: scale(4),
                paddingRight: scale(4),
                marginLeft: scale(4),
              },
            ]}
          >
            BDE
          </Text>
        )}
      </View>
    );

    const hotelView = (
      <HotelInfo
        origin={flightInfo.origin}
        destination={flightInfo.destination}
        departureHotel={
          departurePortHotel &&
          flightInfo.origin === departurePortHotel.stationCode
            ? departurePortHotel.shortName
            : '-'
        }
        departureIsHome={checkHotelIsHome(
          item.baseport,
          departurePortHotel && departurePortHotel.stationCode,
          flightInfo.origin,
        )}
        arrivalHotel={
          arrivalPortHotel &&
          flightInfo.destination === arrivalPortHotel.stationCode
            ? arrivalPortHotel.shortName
            : '-'
        }
        arrivalIsHome={checkHotelIsHome(
          item.baseport,
          arrivalPortHotel && arrivalPortHotel.stationCode,
          flightInfo.destination,
        )}
        styles={styles}
      />
    );

    const positionView = (
      <View style={styles.flexRowItemCenterContainer}>
        <View
          style={[
            styles.positionBox,
            {
              backgroundColor: item.mgmtRequest
                ? colors.darkGrey
                : colors.lightGrey,
              // handle SCCM lenght
              width:
                item.position != null
                  ? item.position.length > 3
                    ? scale(60)
                    : scale(40)
                  : scale(40),
            },
          ]}
        >
          <Text
            style={[
              styles.positionText,
              {
                color: item.mgmtRequest ? colors.white : colors.darkGrey,
              },
            ]}
          >
            {item.position}
          </Text>
        </View>
      </View>
    );

    const positionChangeView = (
      <View
        style={[
          styles.positionBox,
          styles.flexDirectionColumn,
          {
            backgroundColor: colors.warmBlue,
          },
        ]}
      >
        <Text style={[styles.positionText, styles.positionViewLineThrough]}>
          {positionChangeCrew ? positionChangeCrew.from : ''}
        </Text>
        <Text
          style={[
            styles.positionText,
            {
              color: colors.white,
            },
          ]}
        >
          {positionChangeCrew ? positionChangeCrew.to : ''}
        </Text>
      </View>
    );

    const positionChangeViewForIsm = change => {
      if (change.from) {
        return (
          <View
            style={[
              styles.positionBox,
              styles.flexDirectionColumn,
              {
                backgroundColor: colors.warmBlue,
              },
            ]}
          >
            <Text style={[styles.positionText, styles.positionViewLineThrough]}>
              {change.from}
            </Text>
            <Text
              style={[
                styles.positionText,
                {
                  color: colors.white,
                },
              ]}
            >
              {change.to || ''}
            </Text>
          </View>
        );
      } else {
        return (
          <View
            style={[styles.flexDirectionRow, styles.flexJustContentFlexEnd]}
          >
            <View
              style={[
                styles.positionBox,
                {
                  backgroundColor: colors.warmBlue,
                },
              ]}
            >
              <Text
                style={[
                  styles.positionText,
                  {
                    color: colors.white,
                  },
                ]}
              >
                {change.to || ''}
              </Text>
            </View>
          </View>
        );
      }
    };

    const padding = section.title.includes('COCKPIT')
      ? { paddingTop: scale(12), paddingBottom: scale(12) }
      : null;

    const margin =
      isEditPosMode || isEditPAMode
        ? { margin: scale(4), borderRadius: scale(4) }
        : null;

    const border =
      isEditPosMode && isEditSelected
        ? {
            borderColor: colors.warmBlue,
            borderWidth: scale(2),
          }
        : null;

    const headerKey = [];
    if (item.sex === 'M') {
      headerKey.push('M');
    }
    if (item.sex === 'F') {
      headerKey.push('F');
    }

    if (isMySelf) {
      headerKey.push('Me');
    }

    if (isIsmAccess || isMySelf) {
      if (item.isSectionLeader) {
        headerKey.push('Leader');
        if (item.cabin) {
          headerKey.push(item.cabin);
        }
      }
    } else if (isDutyStart) {
      if (item.isSectionLeader) {
        headerKey.push('Leader');
        if (item.cabin) {
          headerKey.push(item.cabin);
        }
      }
    }

    const headerIcon = HEADER_ICON_MAP[headerKey.join('-')];

    return (
      <TouchableOpacity
        style={styles.flexContainer}
        onPress={
          isEditPAMode
            ? () => {
                this._onPAChangeItemClicked(item.currentErn, paText);
              }
            : null
        }
        disabled={!isEditPAMode}
      >
        <View style={[styles.listContainer, padding, margin, border]}>
          <View
            style={[
              styles.flexDirectionRow,
              styles.flexJustContentSpaceBetween,
            ]}
          >
            {isEditPosMode && item.position && !item.mgmtRequest ? (
              // {isEditPosMode ? (
              <TouchableOpacity
                onPress={() => this._updateSwapList(item, index)}
                style={{
                  height: scale(32),
                  width: scale(32),
                }}
              >
                <Image
                  source={isEditSelected ? selectIcon : deselectIcon}
                  style={styles.titleImageStyle}
                />
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  marginTop: scale(4),
                  height: scale(32),
                  width: scale(32),
                }}
              >
                {headerIcon && (
                  <Image
                    style={{
                      height: scale(32),
                      width: scale(32),
                    }}
                    source={headerIcon}
                  />
                )}
              </View>
            )}

            <View style={styles.listItemInfoViewContainer}>
              {nameView()}

              {!section.title.includes('COCKPIT') ? (
                <View style={styles.listItemExtraInfoContainer}>
                  {rankCedNationalityView}
                  {languagePaBDEView}
                  {hotelView}
                </View>
              ) : null}
              {section.title.includes('COCKPIT') ? (
                <View style={styles.listItemExtraInfoContainer}>
                  {baseView}
                  {hotelView}
                </View>
              ) : null}
            </View>

            <View style={styles.listItemPositionAreaContainer}>
              <View
                style={[styles.flexDirectionRow, styles.flexJustContentFlexEnd]}
              >
                <View style={styles.flexDirectionRow}>
                  {item.legends && item.legends.length > 0
                    ? item.legends.map(x => (
                        <View
                          key={x}
                          style={{
                            marginRight: scale(2),
                          }}
                        >
                          <Tooltip
                            height={scale(44)}
                            width={scale(320)}
                            backgroundColor={colors.lightGrey}
                            withOverlay={false}
                            popover={<Text>{LEGENDS_MAP[x]}</Text>}
                          >
                            <Text style={[styles.legendsText]}>{x}</Text>
                          </Tooltip>
                        </View>
                      ))
                    : null}
                </View>
                {specialDutyCodeText.length > 0 ? (
                  <View style={styles.specialDutyBox}>
                    <Text style={styles.specialDutyText}>
                      {specialDutyCodeText}
                    </Text>
                  </View>
                ) : null}
                {isEditPosMode
                  ? positionChangeCrew
                    ? positionChangeView
                    : item.position
                    ? positionView
                    : null
                  : null}
                {!isEditPosMode
                  ? positionChangeCrewForIsm
                    ? positionChangeViewForIsm(positionChangeCrewForIsm)
                    : (isIsmAccess || isMySelf) && item.position
                    ? positionView
                    : isDutyStart && item.position
                    ? positionView
                    : section.title.includes('COCKPIT') && item.position
                    ? positionView
                    : null
                  : null}
                {/* {item.position ? null : null} */}
              </View>
              <View style={styles.flexAlignSelfFlexEnd}>
                {isEmailMode &&
                !isMySelf &&
                item.galacxyId &&
                item.galacxyId.length > 0
                  ? !isIsmAccess && section.title.includes('COCKPIT')
                    ? null
                    : emailView
                  : null}
              </View>
              {(isIsmAccess || isMySelf) &&
                !section.title.includes('COCKPIT') &&
                !isEditPAMode && (
                  <View
                    style={[
                      styles.flexAlignSelfFlexEnd,
                      { marginTop: scale(8) },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => this._updateViewMoreList(item, index)}
                    >
                      <Text style={{ color: colors.warmBlue }}>
                        {isViewMore ? 'View less' : 'View more'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          </View>

          {!isEditPAMode && isViewMore && (
            <View style={{ marginTop: scale(8), marginBottom: scale(8) }}>
              <ListItemSeparatorCrewList />
            </View>
          )}
          {!isEditPAMode && isViewMore && (
            <View
              style={[
                styles.flexRowItemCenterContainer,
                styles.flexJustContentSpaceBetween,
                {
                  marginLeft: scale(36),
                },
              ]}
            >
              <View style={styles.listItemExtraInfoContainer}>
                {item.currentErn && (
                  <Text style={styles.cedText}>{item.currentErn}</Text>
                )}
                {(flightInfo.showBaseport || isMySelf) && (
                  <Text style={styles.cedText}>{`${item.baseport} base`}</Text>
                )}
              </View>

              <View style={styles.listItemExtraInfoContainer}>
                <Text style={styles.cedText}>Cabin history</Text>
                <View style={styles.flexDirectionRow}>
                  {['F', 'J', 'Y'].map(x => (
                    <View
                      key={x}
                      style={[
                        styles.flexAlignItemCenter,
                        styles.flexDirectionRow,
                        styles.flexJustContentCenter,
                        {
                          width: scale(18),
                          height: scale(18),
                          marginRight: scale(4),
                          borderRadius: scale(2),
                          backgroundColor: CABIN_CLASS_COLOR_MAP[x],
                        },
                      ]}
                    >
                      <Text style={[styles.historyText]}>
                        {item.cabinHistory &&
                        item.cabinHistory.find(history => history.cabin === x)
                          ? item.cabinHistory.find(
                              history => history.cabin === x,
                            ).count
                          : 0}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {item.mgmtRequest && (
                <View style={styles.listItemExtraInfoContainer}>
                  <Text style={styles.cedText}>Mgn.request</Text>
                  <Text style={styles.cedText}>
                    {item.mgmtRequest.cabin || item.mgmtRequest.position}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        {section.data.length - 1 === index ? (
          <ListItemSeparatorWithoutSpace />
        ) : null}
      </TouchableOpacity>
    );
  };

  _updateViewMoreList = item => {
    const viewMoreList = this.state.viewMoreList;
    if (!viewMoreList.find(x => x.galacxyId === item.galacxyId)) {
      viewMoreList.push({ galacxyId: item.galacxyId, crewName: item.crewName });
    } else {
      const selectedIndex = viewMoreList
        .map(r => r.galacxyId)
        .indexOf(item.galacxyId);
      viewMoreList.splice(selectedIndex, 1);
    }
    this.setState({ viewMoreList });
  };

  _updateSelectedCrewListForEmail = item => {
    const emailList = this.state.emailList;
    if (!emailList.find(x => x.galacxyId === item.galacxyId)) {
      emailList.push({ galacxyId: item.galacxyId, crewName: item.crewName });
    } else {
      const selectedIndex = emailList
        .map(r => r.galacxyId)
        .indexOf(item.galacxyId);
      emailList.splice(selectedIndex, 1);
    }
    this.setState({ emailList });

    const isSelectedAll = this._checkIsAllSelected(emailList);
    this.props.navigation.setParams({
      isSelectedAll: isSelectedAll,
    });
    console.log('emailList: emailLisst');
  };

  _updateSwapList = item => {
    let swapList = this.state.swapList;
    if (!swapList.find(x => x.galacxyId === item.galacxyId)) {
      if (swapList.length === 2) {
        swapList = [
          {
            galacxyId: item.galacxyId,
            ern: item.currentErn,
            position: item.position,
            badgeName: item.badgeName,
            crewName: item.crewName,
            cabin: item.cabin,
            isSectionLeader: item.isSectionLeader,
            crewStation: item.crewStation,
            cabinQualification: item.cabinQualification || [],
            workingCabins: item.workingCabins || [],
            rankCode: item.rankCode,
            positionRankCode: item.positionRankCode,
          },
        ];
      } else {
        swapList.push({
          galacxyId: item.galacxyId,
          ern: item.currentErn,
          position: item.position,
          badgeName: item.badgeName,
          crewName: item.crewName,
          cabin: item.cabin,
          isSectionLeader: item.isSectionLeader,
          crewStation: item.crewStation,
          cabinQualification: item.cabinQualification || [],
          workingCabins: item.workingCabins || [],
          rankCode: item.rankCode,
          positionRankCode: item.positionRankCode,
        });
      }
    } else {
      const selectedIndex = swapList
        .map(r => r.galacxyId)
        .indexOf(item.galacxyId);
      swapList.splice(selectedIndex, 1);
    }
    this.setState({ swapList });
  };

  renderHeader = ({ section: { title, data } }) => {
    const styles = getStyles(this.props.fontSizeKey);

    if (title === TOTAL_COUNT) {
      return null;
    }

    const isEditPosMode = this.props.navigation.getParam(
      'isEditPosMode',
      false,
    );

    const isEditPAMode = this.props.navigation.getParam('isEditPAMode', false);

    if (isEditPosMode && title === 'COCKPIT CREW') {
      return null;
    }

    if (isEditPosMode && title === 'ISM') {
      if (data.filter(item => item.position !== 'ISM').length === 0) {
        return null;
      }
    }

    if (isEditPAMode && title === 'COCKPIT CREW') {
      return null;
    }

    return (
      <View style={styles.headerStyle}>
        <Text style={styles.headerText}>{title}</Text>
        <ListItemSeparatorWithoutSpace />
      </View>
    );
  };

  renderEmptyList = (section, index) => {
    const styles = getStyles(this.props.fontSizeKey);

    const noItemMessage = `There's no ${
      index === 0 ? 'operating' : 'non operating'
    } ${section.title.includes('COCKPIT') ? 'cockpit' : 'cabin'} crew`;
    if (section.data.length === 0) {
      return (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>{noItemMessage}</Text>
        </View>
      );
    }
    return null;
  };

  onSelectedCrewTypeIndexChange = index => {
    this.setState({ selectedCrewTypeIndex: index });
  };

  _prelimText = (BGcolor, textColor, title) => {
    const styles = getStyles(this.props.fontSizeKey);

    return (
      <View
        style={[
          styles.prelimStyle,
          {
            backgroundColor: BGcolor,
          },
        ]}
      >
        <Text
          style={[
            styles.prelimTextStyle,
            {
              paddingTop: scale(5),
              paddingBottom: scale(5),
              color: textColor,
            },
          ]}
        >
          {title}
        </Text>
      </View>
    );
  };

  _onPosConfirmClicked = async () => {
    try {
      const niState = await NetInfo.fetch();
      const isConnected = niState.isConnected;

      if (!isConnected) {
        showAlert('Alert', 'There is no connection to the internet.', () => {});
        return;
      }

      let flightInfo = {};
      if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
        flightInfo = this.props.flightInfo;
      } else {
        flightInfo = this.props.flightInfoSearch;
      }

      const status = await acknowledgeCrewPos(
        flightInfo.airlineCode,
        flightInfo.flightNumber.padStart(4, '0'),
        flightInfo.flightDate,
        flightInfo.origin,
        flightInfo.destination,
        this.props.galacxyId,
      );

      if (!status) {
        showAlert(
          'Network error',
          'Please retry to acknowledge the position to generate.',
        );
      } else {
        updateCrewPosStatus(
          flightInfo.airlineCode,
          flightInfo.flightNumber,
          flightInfo.flightDate,
          flightInfo.origin,
        );
        this.props.updateCrewPosConfirmAction();
        showAlert('', 'Position confirmed successfully.');
      }
    } catch (err) {
      showAlert('Alert', `Confirm Position error.${err}`);
    }
  };

  _prelimConfirm = () => {
    const styles = getStyles(this.props.fontSizeKey);
    return (
      <View
        style={[
          styles.flexRowItemCenterContainer,
          styles.flexJustContentSpaceBetween,
          {
            backgroundColor: colors.darkSand,
            paddingLeft: scale(16),
            paddingRight: scale(16),
            paddingTop: scale(8),
            paddingBottom: scale(8),
          },
        ]}
      >
        <Text style={[styles.prelimTextStyle, { color: colors.white }]}>
          Acknowledge crew position
        </Text>
        <TouchableOpacity
          style={{
            borderRadius: scale(4),
            borderColor: colors.darkGrey,
            borderWidth: scale(1),
            paddingLeft: scale(8),
            paddingRight: scale(8),
            paddingTop: scale(4),
            paddingBottom: scale(4),
          }}
          onPress={this._onPosConfirmClicked}
        >
          <Text style={{ color: colors.white }}>Confirm</Text>
        </TouchableOpacity>
      </View>
    );
  };

  _confirmCrewPosition = () => {
    const routeName = this.props.navigation.state.routeName;
    let isInHome = routeName.includes(HOME_STACK);

    let crewPos = '';

    if (isInHome) {
      crewPos = this.props.flightInfo.crewposStatus;
    } else {
      crewPos = this.props.flightInfoSearch.crewposStatus;
    }

    let flightInfo = {};
    let isISM = false;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      flightInfo = this.props.flightInfo;
    } else {
      flightInfo = this.props.flightInfoSearch;
    }

    if (flightInfo && flightInfo.crews && flightInfo.crews.length > 0) {
      const isInCrewList = flightInfo.crews.some(
        x => x.galacxyId === this.props.galacxyId,
      );
      if (isInCrewList) {
        const me = flightInfo.crews.find(
          x => x.galacxyId === this.props.galacxyId,
        );
        isISM = me.position === 'SCCM' || me.position === 'ISM';
      }
    }

    let departureTime = '';
    if (flightInfo.actualDepartureTimeUTC) {
      departureTime = flightInfo.actualDepartureTimeUTC;
    } else if (flightInfo.estimateDepartureTimeUTC) {
      departureTime = flightInfo.estimateDepartureTimeUTC;
    } else if (flightInfo.scheduleDepartureTimeUTC) {
      departureTime = flightInfo.scheduleDepartureTimeUTC;
    }
    let isDeparture = true;
    if (departureTime && departureTime.length > 0) {
      const scheduleTime = moment.utc(departureTime, 'YYYY-MM-DD HH:mm:ss');
      const currentTime = moment.utc();
      isDeparture = currentTime.isSameOrAfter(scheduleTime);
    }

    if (isISM && !isDeparture && crewPos && crewPos.includes('prelim')) {
      return this._prelimConfirm();
    } else {
      return null;
    }
  };

  _actionSheetClicked = () => {
    this.ActionSheet.show();
  };

  _selectAllClicked = () => {
    let isIsmAccess = false;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      isIsmAccess = this.props.flightInfo && this.props.flightInfo.isIsmAccess;
    } else {
      isIsmAccess =
        this.props.flightInfoSearch && this.props.flightInfoSearch.isIsmAccess;
    }

    let emailList = [];
    let crewList = [];
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      crewList = this.props.flightInfo.operatingCrews;
      this.state.selectedCrewTypeIndex === 0
        ? (crewList = this.props.flightInfo.operatingCrews)
        : (crewList = this.props.flightInfo.nonOperatingCrews);
    } else {
      this.state.selectedCrewTypeIndex === 0
        ? (crewList = this.props.flightInfoSearch.operatingCrews)
        : (crewList = this.props.flightInfoSearch.nonOperatingCrews);
    }

    for (let index = 0; index < crewList.length; index++) {
      const element = crewList[index];
      const tmpCrewList = element.data
        .filter(
          r =>
            r.galacxyId &&
            r.galacxyId.length > 0 &&
            r.galacxyId !== this.props.galacxyId &&
            (!isIsmAccess ? r.isCabinCrew === true : true),
        )
        .map(r => {
          return {
            galacxyId: r.galacxyId,
            crewName: r.crewName,
          };
        });

      emailList.push(...tmpCrewList);
    }

    this.setState({ emailList });
    this.props.navigation.setParams({
      isSelectedAll: true,
    });
  };

  _deSelectAllClicked = () => {
    this.setState({ emailList: [] });
    this.props.navigation.setParams({
      isSelectedAll: false,
    });
  };

  _cancelClicked = () => {
    this.props.navigation.setParams({
      isEmailMode: false,
      tabBarVisible: true,
      isSelectedAll: false,
    });

    this.setState({ emailList: [] });
  };

  _positionChangeCancelClicked = () => {
    if (this.state.swapList.length > 0 || this.state.swapCacheList.length > 0) {
      showAlertWithCustom(
        'Cancel changes',
        'The changes made have not been saved, confirm to cancel the changes?',
        'No',
        'Yes',
        () => {
          this.props.navigation.setParams({
            isEditPosMode: false,
            tabBarVisible: true,
            isEditPosShowDone: false,
          });

          this.setState({ swapList: [], swapCacheList: [] });
        },
      );
    } else {
      this.props.navigation.setParams({
        isEditPosMode: false,
        tabBarVisible: true,
        isEditPosShowDone: false,
      });
    }
  };

  _paChangeCancelClicked = () => {
    if (this.state.paChange && this.state.paChange.length > 0) {
      showAlertWithCustom(
        'Cancel changes',
        'The changes made have not been saved, confirm to cancel the changes?',
        'No',
        'Yes',
        () => {
          this.props.navigation.setParams({
            isEditPAMode: false,
            tabBarVisible: true,
            isEditPAShowDone: false,
          });

          this.setState({ paChange: [] });
        },
      );
    } else {
      this.props.navigation.setParams({
        isEditPAMode: false,
        tabBarVisible: true,
        isEditPAShowDone: false,
      });
    }
  };

  _onPositionChange = ({ isSuccess }) => {
    if (isSuccess) {
      //exit Edit mode
      this.props.navigation.setParams({
        isEditPosMode: false,
        tabBarVisible: true,
        isEditPosShowDone: false,
      });
      this.setState({ swapList: [], swapCacheList: [] });
    }
  };

  _editPosDoneClicked = () => {
    const {
      airlineCode,
      flightNumber,
      flightDate,
      flightDateDisplay,
      origin,
      destination,
      aircraftType,
      crews,
      transformedCrews,
      operatingCrews,
    } = this.getFlightInfo();
    this.props.navigation.navigate('PositionSummaryModal', {
      swapCacheList: this.state.swapCacheList,
      airlineCode,
      flightNumber,
      flightDate,
      flightDateDisplay,
      origin,
      destination,
      aircraftType,
      crews,
      transformedCrews,
      operatingCrews,
      onPositionChange: this._onPositionChange,
    });
  };

  _onPAChange = ({ ern, changeList }) => {
    let paChange = this.state.paChange;

    paChange = paChange.reduce(
      (prev, current) => {
        const index = prev.findIndex(x => x.ern === current.ern);
        if (index > -1) {
          return prev;
        } else {
          const newList = current.changeList.filter(
            x => changeList.indexOf(x) === -1,
          );

          prev.push({ ern: current.ern, changeList: newList });
          return prev;
        }
      },
      [{ ern, changeList }],
    );

    this.setState({
      paChange,
    });
    this.props.navigation.setParams({
      isEditPAShowDone: true,
    });
  };

  _onPAChangeItemClicked = (ern, paText) => {
    const {
      airlineCode,
      flightNumber,
      flightDate,
      flightDateDisplay,
      origin,
      destination,
    } = this.getFlightInfo();
    this.props.navigation.navigate('ChangePAModal', {
      airlineCode,
      flightNumber,
      flightDate,
      flightDateDisplay,
      origin,
      destination,
      ern,
      paText,
      onPAChange: this._onPAChange,
    });
  };

  findUpdateOperatingCrewList = (operatingCrewsList, paChange) => {
    let paChangeList = [];

    paChange.forEach(change => {
      paChangeList = paChangeList.concat(change.changeList);
    });

    return operatingCrewsList.map(operatingCrew => {
      const data = operatingCrew.data.map(crew => {
        // remove old pa
        if (crew.isPA) {
          //
          const langs = crew.paLang;
          if (!langs || langs.length === 0) {
            // handle CT
            if (paChangeList.includes('CT')) {
              // remove pa
              crew.isPA = false;
              crew.paLang = [];
            }
          } else {
            const newPaList = [];
            langs.forEach(lang => {
              if (!paChangeList.includes(lang)) {
                newPaList.push(lang);
              }
            });
            if (newPaList.length === 0) {
              // remove pa
              crew.isPA = false;
              crew.paLang = [];
            } else {
              // change pa
              crew.paLang = newPaList;
            }
          }
        }

        // add new pa
        const change = paChange.find(x => x.ern === crew.currentErn);
        if (change) {
          crew.isPA = change.changeList.length > 0;
          crew.paLang = change.changeList;
        }
        return crew;
      });
      operatingCrew.data = data;
      return operatingCrew;
    });
  };

  _editPADoneClicked = async () => {
    const {
      airlineCode,
      flightNumber,
      flightDate,
      origin,
      destination,
      crews,
      operatingCrews,
    } = this.getFlightInfo();

    let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
      //check Params
      const paChange = this.state.paChange;
      this.setState({ isSubmitting: true });
      const [error, status] = await changePA(
        airlineCode,
        flightNumber,
        flightDate,
        origin,
        destination,
        paChange,
      );
      if (status) {
        const updateCrewList = getCrewPaChangeList(crews, paChange);
        const updateOperatingCrewList = this.findUpdateOperatingCrewList(
          operatingCrews,
          paChange,
        );
        this.props.updatePaChangeAction(
          updateCrewList,
          updateOperatingCrewList,
        );
        updateCrewPaChange(
          airlineCode,
          flightNumber,
          flightDate,
          origin,
          paChange,
        );
        //exit Edit mode
        this.props.navigation.setParams({
          isEditPAMode: false,
          tabBarVisible: true,
          isEditPAShowDone: false,
        });
        this.setState({ paChange: [] });
        this.setState({ isSubmitting: false, submitSuccess: true });
        await wait(2000);
        this.setState({ submitSuccess: null });
      } else {
        this.setState({ isSubmitting: false, submitFail: error });
        await wait(2000);
        console.log('submit fail');
        this.setState({ submitFail: '' });
      }
    } catch (err) {
      this.setState({
        isSubmitting: false,
        submitFail: 'Please try again later.',
      });
      await wait(2000);
      this.setState({ submitFail: '' });
    }
  };

  _sendEmailClicked = () => {
    let flightInfo = {};

    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      flightInfo = this.props.flightInfo;
    } else {
      flightInfo = this.props.flightInfoSearch;
    }

    let isInCrewList = false;

    if (flightInfo && flightInfo.crews && flightInfo.crews.length > 0) {
      isInCrewList = flightInfo.crews.some(
        x => x.galacxyId === this.props.galacxyId,
      );
    }

    if (isInCrewList || flightInfo.isIsmAccess) {
      this.props.navigation.setParams({
        isEmailMode: true,
        tabBarVisible: false,
      });
      this.setState({ emailList: [] });
    } else {
      showAlert('', 'You are not on the crew list.');
    }
  };

  _changePosClicked = () => {
    this.props.navigation.setParams({
      isEditPosMode: true,
      tabBarVisible: false,
    });
    this.setState({ swapList: [], swapCacheList: [] });
  };

  _changePAClicked = () => {
    this.props.navigation.setParams({
      isEditPAMode: true,
      tabBarVisible: false,
    });
    this.setState({ paChange: [] });
  };

  _setActionSheet = () => {
    let flightInfo = {};
    let isISM = false;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      flightInfo = this.props.flightInfo;
    } else {
      flightInfo = this.props.flightInfoSearch;
    }

    if (flightInfo && flightInfo.crews && flightInfo.crews.length > 0) {
      const isInCrewList = flightInfo.crews.some(
        x => x.galacxyId === this.props.galacxyId,
      );
      if (isInCrewList) {
        const me = flightInfo.crews.find(
          x => x.galacxyId === this.props.galacxyId,
        );
        isISM = me.position === 'SCCM' || me.position === 'ISM';
      }
    }

    let departureTime = '';
    if (flightInfo.actualDepartureTimeUTC) {
      departureTime = flightInfo.actualDepartureTimeUTC;
    } else if (flightInfo.estimateDepartureTimeUTC) {
      departureTime = flightInfo.estimateDepartureTimeUTC;
    } else if (flightInfo.scheduleDepartureTimeUTC) {
      departureTime = flightInfo.scheduleDepartureTimeUTC;
    }
    let isDeparture = true;
    if (departureTime && departureTime.length > 0) {
      const scheduleTime = moment.utc(departureTime, 'YYYY-MM-DD HH:mm:ss');
      const currentTime = moment.utc();
      isDeparture = currentTime.isSameOrAfter(scheduleTime);
    }

    const selectedCrewTypeIndex = this.state.selectedCrewTypeIndex;

    let CHANGE_POS;
    let ASSIGN_PA;
    let PRINT_INDEX;
    let EMAIL_INDEX;
    let CANCEL_INDEX;

    let optionsList;
    if (isISM && !isDeparture && selectedCrewTypeIndex === 0) {
      optionsList = [
        'Edit Position',
        'Assign PA',
        'Print screen for whole crew list',
        'Send email to crew',
        'Cancel',
      ];
      CHANGE_POS = 0;
      ASSIGN_PA = 1;
      PRINT_INDEX = 2;
      EMAIL_INDEX = 3;
      CANCEL_INDEX = 4;
    } else {
      optionsList = [
        'Print screen for whole crew list',
        'Send email to crew',
        'Cancel',
      ];
      PRINT_INDEX = 0;
      EMAIL_INDEX = 1;
      CANCEL_INDEX = 2;
    }

    return (
      <ActionSheet
        ref={o => (this.ActionSheet = o)}
        title={'Choose your action'}
        options={optionsList}
        cancelButtonIndex={CANCEL_INDEX}
        onPress={index => {
          switch (index) {
            case CHANGE_POS:
              this._changePosClicked();
              break;
            case ASSIGN_PA:
              this._changePAClicked();
              break;
            case PRINT_INDEX:
              this._captureScreen();
              break;
            case EMAIL_INDEX:
              this._sendEmailClicked();
              break;
          }
        }}
      />
    );
  };

  _checkIsAllSelected = emailList => {
    if (emailList.length > 0) {
      let isIsmAccess = false;
      if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
        isIsmAccess =
          this.props.flightInfo && this.props.flightInfo.isIsmAccess;
      } else {
        isIsmAccess =
          this.props.flightInfoSearch &&
          this.props.flightInfoSearch.isIsmAccess;
      }

      let crewList = [];
      let allCrewList = [];

      if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
        crewList = this.props.flightInfo.operatingCrews;
        this.state.selectedCrewTypeIndex === 0
          ? (crewList = this.props.flightInfo.operatingCrews)
          : (crewList = this.props.flightInfo.nonOperatingCrews);
      } else {
        this.state.selectedCrewTypeIndex === 0
          ? (crewList = this.props.flightInfoSearch.operatingCrews)
          : (crewList = this.props.flightInfoSearch.nonOperatingCrews);
      }

      for (let index = 0; index < crewList.length; index++) {
        const element = crewList[index];
        const tmpCrewList = element.data.filter(
          r =>
            r.galacxyId &&
            r.galacxyId.length > 0 &&
            r.galacxyId !== this.props.galacxyId &&
            (!isIsmAccess ? r.isCabinCrew === true : true),
        );

        allCrewList.push(...tmpCrewList);
      }

      if (allCrewList.length > 0) {
        const selectedOperatingCrewList = [];
        for (let index = 0; index < allCrewList.length; index++) {
          const element = allCrewList[index];
          const tmp = this.state.emailList.find(
            r => r.galacxyId === element.galacxyId,
          );
          if (tmp) {
            selectedOperatingCrewList.push(element);
          }
        }

        return selectedOperatingCrewList.length === allCrewList.length;
      }
      return false;
    }
  };

  _ListItemSpace = () => {
    const isEmailMode = this.props.navigation.getParam('isEmailMode', false);

    return (
      <View
        style={{
          height:
            (isEmailMode ? scale(200) : scale(12)) + layout.safeMarginBottom,
        }}
      />
    );
  };

  getSubmitEmailString = (isIsmAccess, selectedCrewTypeIndex) => {
    if (isIsmAccess) {
      if (selectedCrewTypeIndex === 0) {
        return 'All operating Cockpit and Cabin Crew';
      } else if (selectedCrewTypeIndex === 1) {
        return 'All non-operating Cockpit and Cabin Crew';
      }
    } else {
      if (selectedCrewTypeIndex === 0) {
        return 'All operating Cabin Crew';
      } else if (selectedCrewTypeIndex === 1) {
        return 'All non-operating Cabin Crew';
      }
    }
  };

  _checkList = list => {
    let carbinCrewCount = 0;
    let cockpitCrewCount = 0;

    list.forEach(r => {
      if (r.data && r.data.length > 0) {
        carbinCrewCount += r.data.filter(x => x.isCabinCrew).length;
        cockpitCrewCount += r.data.filter(x => !x.isCabinCrew).length;
      }
    });

    return { carbinCrewCount, cockpitCrewCount };
  };

  _generateCrewNum = (opList, nonOpList) => {
    const isEditPosMode = this.props.navigation.getParam(
      'isEditPosMode',
      false,
    );

    let totalOperateCrew = '';
    let totalNonOperateCrew = '';

    const opGroup = this._checkList(opList);
    const nonpGroup = this._checkList(nonOpList);

    if (isEditPosMode) {
      totalOperateCrew = `Total crew: ${opGroup.carbinCrewCount -
        1} cabin crew`;
    } else {
      totalOperateCrew = `Total crew: ${opGroup.carbinCrewCount} cabin crew + ${opGroup.cockpitCrewCount} cockpit crew`;
    }

    totalNonOperateCrew = `Total crew: ${nonpGroup.carbinCrewCount} cabin crew + ${nonpGroup.cockpitCrewCount} cockpit crew`;

    return { totalOperateCrew, totalNonOperateCrew };
  };

  _getCrewNum = () => {
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      const opCrewList = this.props.flightInfo.operatingCrews
        ? this.props.flightInfo.operatingCrews
        : [];
      const nonOpCrewList = this.props.flightInfo.nonOperatingCrews
        ? this.props.flightInfo.nonOperatingCrews
        : [];

      return this._generateCrewNum(opCrewList, nonOpCrewList);
    } else {
      const opCrewList = this.props.flightInfoSearch.operatingCrews
        ? this.props.flightInfoSearch.operatingCrews
        : [];
      const nonOpCrewList = this.props.flightInfoSearch.nonOperatingCrews
        ? this.props.flightInfoSearch.nonOperatingCrews
        : [];

      return this._generateCrewNum(opCrewList, nonOpCrewList);
    }
  };

  _swapListView = () => {
    const styles = getStyles(this.props.fontSizeKey);
    const swapList = this.state.swapList;

    const fromPosition = swapList[0];
    const toPosition = swapList[1];

    const ViewWidth = (getWidth() - scale(32) - scale(16)) / 2;

    const secondBorder =
      swapList.length !== 0
        ? {
            borderColor: colors.warmBlue,
          }
        : null;

    const secondTextColor =
      swapList.length !== 0
        ? {
            color: colors.darkGrey,
          }
        : null;

    return (
      <View>
        <View
          style={[
            styles.flexRowItemCenterContainer,
            styles.flexJustContentSpaceBetween,
          ]}
        >
          <View
            style={[
              styles.swapViewItemContainer,
              {
                borderColor: colors.warmBlue,
                width: ViewWidth,
              },
            ]}
          >
            {fromPosition ? (
              <>
                <View
                  style={{
                    maxWidth: ViewWidth - scale(56),
                    paddingRight: scale(4),
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.badgeNameText,
                      {
                        ...commonStyles.text.medium,
                      },
                    ]}
                  >
                    {fromPosition.badgeName}
                  </Text>
                  <Text numberOfLines={1} style={styles.crewNameText}>
                    {fromPosition.crewName}
                  </Text>
                </View>

                <View
                  style={[
                    styles.positionBox,
                    styles.flexAlignSelfFlexEnd,
                    {
                      backgroundColor: colors.lightGrey,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.positionText,
                      {
                        color: colors.darkGrey,
                      },
                    ]}
                  >
                    {fromPosition.position}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={{ color: colors.darkGrey }}>Select a crew</Text>
            )}
          </View>
          <Image
            source={swapIcon}
            style={{ height: scale(32), width: scale(32) }}
          />
          <View
            style={[
              styles.swapViewItemContainer,
              {
                borderColor: colors.lightGrey,
                width: ViewWidth,
              },
              secondBorder,
            ]}
          >
            {toPosition ? (
              <>
                <View
                  style={{
                    maxWidth: ViewWidth - scale(56),
                    paddingRight: scale(4),
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.badgeNameText,
                      {
                        ...commonStyles.text.medium,
                      },
                    ]}
                  >
                    {toPosition.badgeName}
                  </Text>
                  <Text numberOfLines={1}>{toPosition.crewName}</Text>
                </View>

                <View
                  style={[
                    styles.positionBox,
                    styles.flexAlignSelfFlexEnd,
                    {
                      backgroundColor: colors.lightGrey,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.positionText,
                      {
                        color: colors.darkGrey,
                      },
                    ]}
                  >
                    {toPosition.position}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={[{ color: colors.lightGrey }, secondTextColor]}>
                Select a crew to swap position with
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  _percentageView = (cabin, physicalCount, bookedCount, bookedInfantCount) => {
    const styles = getStyles(this.props.fontSizeKey);

    let percentage;
    let bookedText;
    let totalText;
    let height;
    if (
      physicalCount === null ||
      bookedCount === null ||
      bookedInfantCount === null
    ) {
      percentage = 0;
      bookedText = '---';
      totalText = `${cabin} ---`;
      height = 0;
    } else {
      percentage =
        physicalCount > 0
          ? Math.round(
              ((bookedCount + bookedInfantCount) / physicalCount) * 100,
            )
          : 0;
      bookedText =
        bookedInfantCount === 0
          ? `${bookedCount}`
          : `${bookedCount} + ${bookedInfantCount}`;
      totalText = `${cabin} ${physicalCount}`;
      height =
        physicalCount > 0
          ? (36 * (bookedCount + bookedInfantCount)) / physicalCount
          : 0;
    }

    let color = '#005d63';
    if (height > 36) {
      height = 36;
      color = '#a71800';
    }

    return (
      <View key={cabin} style={styles.percentageViewContainer}>
        <Text>{bookedText}</Text>
        <View style={styles.percentageViewBarViewContainer}>
          <View style={styles.percentageViewBarViewBG} />
          <View
            style={[
              styles.percentageViewBarView,
              {
                backgroundColor: color,
                height: scale(height),
              },
            ]}
          />
          <Text
            style={styles.percentageViewBarViewText}
          >{`${percentage}%`}</Text>
        </View>
        <Text>{totalText}</Text>
      </View>
    );
  };
  _passengerLoadingView = () => {
    const styles = getStyles(this.props.fontSizeKey);

    let flightInfo;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      flightInfo = this.props.flightInfo;
    } else {
      flightInfo = this.props.flightInfoSearch;
    }
    if (flightInfo) {
      const airlineCode = flightInfo.airlineCode;
      let physicalText;

      let physicalFCLCount;
      let physicalJCLCount;
      let physicalWCLCount;
      let physicalYCLCount;

      if (airlineCode === 'CX') {
        physicalFCLCount = flightInfo.physicalFCLCount;
        physicalJCLCount = flightInfo.physicalJCLCount;
        physicalWCLCount = flightInfo.physicalWCLCount;
        physicalYCLCount = flightInfo.physicalYCLCount;
        physicalText = 'Physical Capacity';
      } else if (airlineCode === 'KA') {
        physicalFCLCount = flightInfo.saleableFCLCount;
        physicalJCLCount = flightInfo.saleableJCLCount;
        physicalWCLCount = flightInfo.saleableWCLCount;
        physicalYCLCount = flightInfo.saleableYCLCount;
        physicalText = 'Saleable config';
      }

      const bookedFCLCount = flightInfo.bookedFCLCount;
      const bookedJCLCount = flightInfo.bookedJCLCount;
      const bookedWCLCount = flightInfo.bookedWCLCount;
      const bookedYCLCount = flightInfo.bookedYCLCount;

      const bookedFCLInfantCount = flightInfo.bookedFCLInfantCount;
      const bookedJCLInfantCount = flightInfo.bookedJCLInfantCount;
      const bookedWCLInfantCount = flightInfo.bookedWCLInfantCount;
      const bookedYCLInfantCount = flightInfo.bookedYCLInfantCount;

      const array = [];
      array.push({
        cabin: 'F',
        physicalCount: physicalFCLCount,
        bookedCount: bookedFCLCount,
        bookedInfantCount: bookedFCLInfantCount,
      });
      array.push({
        cabin: 'J',
        physicalCount: physicalJCLCount,
        bookedCount: bookedJCLCount,
        bookedInfantCount: bookedJCLInfantCount,
      });
      array.push({
        cabin: 'W',
        physicalCount: physicalWCLCount,
        bookedCount: bookedWCLCount,
        bookedInfantCount: bookedWCLInfantCount,
      });
      array.push({
        cabin: 'Y',
        physicalCount: physicalYCLCount,
        bookedCount: bookedYCLCount,
        bookedInfantCount: bookedYCLInfantCount,
      });

      return (
        <View style={{ backgroundColor: colors.lightGrey }}>
          <View
            style={{
              backgroundColor: colors.white,
              margin: scale(4),
              borderRadius: scale(4),
            }}
          >
            <View style={styles.passengerLoadingViewTitleContainer}>
              <Text>Flight loading details</Text>
              <TouchableOpacity onPress={this._viewPassenger}>
                <Text>
                  {this.state.viewMorePassenger ? 'View less' : 'View more'}
                </Text>
              </TouchableOpacity>
            </View>

            {this.state.viewMorePassenger && (
              <>
                <View style={styles.passengerLoadingViewContainer} />
                <View style={styles.passengerLoadingViewInfoViewContainer}>
                  <View>
                    <Text>Booked Total</Text>
                    <View
                      style={{
                        height: scale(36),
                        marginTop: scale(9),
                        marginBottom: scale(5),
                      }}
                    />
                    <Text>{physicalText}</Text>
                  </View>
                  <View
                    style={styles.passengerLoadingViewPercentageViewContainer}
                  >
                    {array.map(el =>
                      this._percentageView(
                        el.cabin,
                        el.physicalCount,
                        el.bookedCount,
                        el.bookedInfantCount,
                      ),
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      );
    } else {
      return null;
    }
  };

  render() {
    console.log('terryterry render CrewListScreen [render]');

    const styles = getStyles(this.props.fontSizeKey);

    const routeName = this.props.navigation.state.routeName;

    const isEmailMode = this.props.navigation.getParam('isEmailMode', false);
    const isEditPosMode = this.props.navigation.getParam(
      'isEditPosMode',
      false,
    );
    const isEditPAMode = this.props.navigation.getParam('isEditPAMode', false);

    let isInHome = routeName.includes(HOME_STACK);
    let flightInfo = {};

    if (isInHome) {
      flightInfo = this.props.flightInfo;
    } else {
      flightInfo = this.props.flightInfoSearch;
    }

    let crewError = null;
    if (
      flightInfo.crewErrorMessage === '' ||
      (flightInfo.crewErrorMessage && flightInfo.crewErrorMessage.length > 0)
    ) {
      crewError = flightInfo.crewErrorMessage;
    }

    console.log('crewError:' + crewError);

    const index = this.state.selectedCrewTypeIndex;

    let sectionData =
      index === 0 ? flightInfo.operatingCrews : flightInfo.nonOperatingCrews;

    if (!sectionData) {
      sectionData = [];
    } else {
      const crewNum = this._getCrewNum();

      if (index === 0) {
        sectionData = [
          { title: TOTAL_COUNT, data: [crewNum.totalOperateCrew] },
          ...sectionData,
        ];
      } else {
        sectionData = [
          { title: TOTAL_COUNT, data: [crewNum.totalNonOperateCrew] },
          ...sectionData,
        ];
      }
    }

    // for screen capture
    var oneSectionData = [];
    var secondSectionData = [];
    var total = 0;
    if (Platform.OS === 'ios') {
      for (var item = 0; item < sectionData.length; item++) {
        total += sectionData[item].data.length;
        if (total > 10) {
          if (item === 0) {
            continue;
          }
          oneSectionData = sectionData.slice(0, item - 1);
          secondSectionData = sectionData.slice(item - 1, sectionData.length);
          continue;
        }
      }
    }

    const additionalStyle = {};
    const { width, height, selectedCrewTypeIndex } = this.state;

    if (width) {
      additionalStyle.width = width;
      additionalStyle.height = height;
    }

    const screenWidth = getWidth();

    const isSelectedAll = this.props.navigation.getParam(
      'isSelectedAll',
      false,
    );

    let isIsmAccess = false;
    if (this.props.navigation.state.routeName.includes(HOME_STACK)) {
      isIsmAccess = this.props.flightInfo && this.props.flightInfo.isIsmAccess;
    } else {
      isIsmAccess =
        this.props.flightInfoSearch && this.props.flightInfoSearch.isIsmAccess;
    }

    const MAX_NAME_SHOWN = 2;
    const emailList = this.state.emailList;
    const nameListString =
      emailList.length <= MAX_NAME_SHOWN
        ? emailList.map(r => r.crewName).join(' & ')
        : emailList
            .filter((r, emailListIndex) => emailListIndex < MAX_NAME_SHOWN)
            .map(r => r.crewName)
            .join(' & ') + ` & ${emailList.length - MAX_NAME_SHOWN} more...`;

    const submitEmailView = (
      <View style={styles.submitEmailStyles}>
        <Text style={styles.emailStyle}>email</Text>
        <Text style={styles.crewListStyle}>
          {isSelectedAll
            ? this.getSubmitEmailString(isIsmAccess, selectedCrewTypeIndex)
            : nameListString}
        </Text>
        <TouchableOpacity
          style={styles.continueStyle}
          onPress={this._onSendEmailClicked}
        >
          <Text style={styles.continueTextStyle}>Continue</Text>
        </TouchableOpacity>
      </View>
    );

    const swapConfirmView = (
      <View style={styles.submitEmailStyles}>
        <TouchableOpacity
          style={[styles.continueStyle, { marginTop: scale(10) }]}
          onPress={this._onSwapClicked}
        >
          <Text style={styles.continueTextStyle}>Swap</Text>
        </TouchableOpacity>
      </View>
    );

    let CREW_TYPE_LIST;
    if (isIsmAccess) {
      CREW_TYPE_LIST = ['Operating', 'Non Operating', 'Summary'];
    } else {
      CREW_TYPE_LIST = ['Operating Crew', 'Non Operating Crew'];
    }

    let sectionListStyle = Platform.OS === 'ios' ? { top: 0, bottom: 0 } : null;

    return (
      <View style={styles.flexContainer}>
        {/* ///////////////////////// */}
        {this.state.isSubmitting ? (
          <View style={styles.overlay}>
            <Animated.Image
              source={sendingIcon}
              style={{
                height: scale(62),
                width: scale(62),
                transform: [{ rotate: this.rotate }],
              }}
            />
            <Text style={styles.sendText}>Submitting</Text>
          </View>
        ) : null}
        {this.state.submitSuccess ? (
          <View style={styles.overlay}>
            <Image
              source={successIcon}
              style={{
                height: scale(62),
                width: scale(62),
              }}
            />
            <Text style={styles.sendText}>Submitted</Text>
          </View>
        ) : null}
        {this.state.submitFail.length > 0 ? (
          <View style={styles.overlay}>
            <Image
              source={failIcon}
              style={{
                height: scale(62),
                width: scale(62),
              }}
            />
            <Text style={[styles.sendText, styles.submitFailText]}>
              {this.state.submitFail}
            </Text>
          </View>
        ) : null}
        <View
          style={[
            styles.sectionListContainer,
            {
              left: screenWidth /* basically should be screenSize.width */,
            },
            sectionListStyle,
          ]}
        >
          <SectionList
            onLayout={this._onLayout}
            onContentSizeChange={this._onContentSizeChange2}
            contentContainerStyle={[
              styles.sectionListContentContainer,
              { width: screenWidth },
            ]}
            ref={this._setSecondCrewListRef}
            renderItem={this.renderListItem}
            renderSectionHeader={this.renderHeader}
            sections={oneSectionData.length > 0 ? oneSectionData : sectionData}
            renderSectionFooter={({ section }) =>
              this.renderEmptyList(section, this.state.selectedCrewTypeIndex)
            }
            keyExtractor={(item, keyIndex) => keyIndex.toString()}
            ItemSeparatorComponent={
              isEditPosMode || isEditPAMode ? null : ListItemSeparatorCrewList
            }
            style={[{ backgroundColor: colors.white }]}
          />
        </View>
        {/* handle screen capture */}
        {secondSectionData.length > 0 ? (
          <View
            style={[
              styles.sectionListContainer,
              {
                left:
                  screenWidth * 2 /* basically should be screenSize.width */,
              },
              sectionListStyle,
            ]}
          >
            <SectionList
              onLayout={this._onLayout}
              onContentSizeChange={this._onContentSizeChange3}
              contentContainerStyle={[
                styles.sectionListContentContainer,
                { width: screenWidth },
              ]}
              ref={this._setSecondCrewListRef2}
              renderItem={this.renderListItem}
              renderSectionHeader={this.renderHeader}
              sections={secondSectionData}
              renderSectionFooter={({ section }) =>
                this.renderEmptyList(section, this.state.selectedCrewTypeIndex)
              }
              keyExtractor={(item, keyIndex) => keyIndex.toString()}
              ItemSeparatorComponent={
                isEditPosMode || isEditPAMode ? null : ListItemSeparatorCrewList
              }
              style={[{ backgroundColor: colors.white }]}
            />
          </View>
        ) : null}
        {/* ///////////////////// */}
        {this._setActionSheet()}
        {!isEmailMode && !isEditPosMode && !isEditPAMode ? (
          <View>
            <View style={styles.background}>
              <SwitchButtonGroup
                onPress={this.onSelectedCrewTypeIndexChange}
                selectedIndex={this.state.selectedCrewTypeIndex}
                buttonTexts={CREW_TYPE_LIST}
                style={styles.switchStyle}
              />
              <ListItemSeparatorWithoutSpace />
            </View>
            {this._confirmCrewPosition()}
          </View>
        ) : null}
        {isEditPosMode && this._swapListView()}
        {isEditPosMode && this._passengerLoadingView()}
        {(this.state.selectedCrewTypeIndex === 0 ||
          this.state.selectedCrewTypeIndex === 1) &&
          (crewError === null ? (
            <View
              style={[
                styles.flexContainer,
                { backgroundColor: colors.lightGrey },
              ]}
            >
              <SectionList
                onContentSizeChange={this._onContentSizeChange}
                collapsable={false}
                ref={this._setCrewListRef}
                renderItem={this.renderListItem}
                renderSectionHeader={this.renderHeader}
                sections={sectionData}
                renderSectionFooter={({ section }) =>
                  this.renderEmptyList(
                    section,
                    this.state.selectedCrewTypeIndex,
                  )
                }
                keyExtractor={(item, keyIndex) => keyIndex.toString()}
                ItemSeparatorComponent={
                  isEditPosMode || isEditPAMode
                    ? null
                    : ListItemSeparatorCrewList
                }
                style={[
                  styles.flexContainer,
                  { backgroundColor: colors.lightGrey },
                ]}
                ListFooterComponent={this._ListItemSpace}
              />
              {this.state.emailList.length > 0 ? submitEmailView : null}
              {this.state.swapList.length === 2 ? swapConfirmView : null}
            </View>
          ) : (
            <View
              style={[
                styles.flexContainer,
                styles.flexJustContentCenter,
                styles.flexAlignItemCenter,
                {
                  backgroundColor: colors.white,
                },
              ]}
            >
              <Text style={styles.cannotDisplayStyle}>
                Crew list not available, please refresh later
              </Text>
              <Text style={styles.errorStyle}>{crewError}</Text>
            </View>
          ))}
        {this.state.selectedCrewTypeIndex === 2 && (
          <View style={[styles.flexContainer]}>
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
              <View
                style={{
                  paddingBottom: scale(64),
                }}
              >
                <CrewStationView
                  aircraftType={flightInfo.aircraftType}
                  transformedCrews={flightInfo.transformedCrews}
                  swapCacheList={this.state.swapCacheList}
                  forSummary={true}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    );
  }
}

const HotelInfo = ({
  departureHotel,
  arrivalHotel,
  departureIsHome,
  arrivalIsHome,
  origin,
  destination,
  styles,
}) => {
  return (
    <View>
      <View style={styles.hotelViewContainer}>
        <Image
          source={hotelIcon}
          style={[
            styles.icon,
            { marginLeft: -scale(5), marginRight: scale(2) },
          ]}
        />
        <Text style={styles.cedText}>{origin + ': '}</Text>
        {departureIsHome ? (
          <Image
            source={hotelHomeIcon}
            style={[styles.icon, { marginRight: scale(2) }]}
          />
        ) : (
          <Text style={styles.cedText}>
            {departureHotel ? departureHotel : '-'}
          </Text>
        )}
      </View>
      <View style={styles.hotelViewContainer}>
        <Text style={{ ...styles.cedText, marginLeft: scale(21) }}>
          {destination + ': '}
        </Text>
        {arrivalIsHome ? (
          <Image
            source={hotelHomeIcon}
            style={[styles.icon, { marginRight: scale(2) }]}
          />
        ) : (
          <Text style={styles.cedText}>
            {arrivalHotel ? arrivalHotel : '-'}
          </Text>
        )}
      </View>
    </View>
  );
};

const getStyles = fontSizeKey => {
  let fs = getCurrentTextSize(fontSizeKey);

  return StyleSheet.create({
    flexContainer: {
      flex: 1,
    },
    flexDirectionRow: {
      flexDirection: 'row',
    },
    flexDirectionColumn: {
      flexDirection: 'column',
    },
    flexRowItemCenterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flexJustContentCenter: {
      justifyContent: 'center',
    },
    flexJustContentSpaceBetween: {
      justifyContent: 'space-between',
    },
    flexJustContentFlexEnd: {
      justifyContent: 'flex-end',
    },
    flexAlignItemCenter: {
      alignItems: 'center',
    },
    flexAlignSelfFlexEnd: {
      alignSelf: 'flex-end',
    },
    background: {
      backgroundColor: colors.white,
    },
    listContainer: {
      backgroundColor: colors.white,
      padding: scale(8),
    },
    switchStyle: {
      backgroundColor: colors.white,
      marginLeft: scale(18),
      marginRight: scale(18),
    },
    badgeNameText: {
      ...commonStyles.text.regular,
      fontSize: scale(fs.fontSize),
      color: colors.darkGrey,
    },
    crewNameText: {
      ...commonStyles.text.regular,
      fontSize: scale(fs.fontSize - 3),
      color: colors.darkGrey,
    },
    positionBox: {
      borderRadius: scale(2),
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minWidth: scale(32),
      minHeight: scale(32),
      height: scale(40),
      width: scale(40),
    },
    positionText: {
      ...commonStyles.text.regular,
      fontSize: scale(fs.fontSize - 2),
    },
    legendsText: {
      ...commonStyles.text.regular,
      fontSize: scale(fs.fontSize - 4),
      color: colors.darkGrey,
      backgroundColor: colors.highLightGrey,
      width: scale(20),
      height: scale(20),
      textAlign: 'center',
      lineHeight: scale(20),
    },
    specialDutyBox: {
      borderRadius: scale(2),
      backgroundColor: colors.lightGold,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      minWidth: scale(32),
      minHeight: scale(32),
      height: scale(40),
      width: scale(40),
      marginRight: scale(2),
    },
    specialDutyText: {
      ...commonStyles.text.regular,
      fontSize: scale(fs.fontSize - 2),
      color: colors.darkGrey,
    },
    headerStyle: {
      backgroundColor: colors.lightGrey,
      height: scale(28),
      justifyContent: 'flex-end',
      flex: 1,
    },
    headerText: {
      ...commonStyles.text.regular,
      paddingLeft: scale(16),
      color: colors.lessDarkGrey,
      fontSize: scale(fs.fontSize - 2),
      marginBottom: scale(3),
    },
    cedText: {
      ...commonStyles.text.regular,
      color: colors.darkGrey,
      fontSize: scale(fs.fontSize - 3),
    },
    historyText: {
      ...commonStyles.text.regular,
      color: colors.white,
      fontSize: scale(fs.fontSize - 6),
    },
    middleText: {
      ...commonStyles.text.regular,
      color: colors.darkGrey,
      fontSize: scale(fs.fontSize - 3),
      marginLeft: scale(2),
    },
    emptyListContainer: {
      minHeight: verticalScale(60),
      backgroundColor: colors.white,
      justifyContent: 'center',
    },
    emptyListText: {
      ...commonStyles.text.regular,
      marginLeft: scale(16),
      marginRight: scale(12),
      color: colors.black,
      fontSize: scale(fs.fontSize + 2),
    },
    cannotDisplayStyle: {
      ...commonStyles.text.regular,
      color: colors.darkGrey,
      fontSize: scale(fs.fontSize + 13),
      textAlign: 'center',
    },
    errorStyle: {
      ...commonStyles.text.regular,
      color: colors.darkGrey,
      fontSize: scale(fs.fontSize - 1),
      marginTop: verticalScale(16),
      marginLeft: scale(62),
      marginRight: scale(62),
      textAlign: 'center',
    },
    prelimStyle: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    prelimTextStyle: {
      ...commonStyles.text.regular,
      fontSize: scale(fs.fontSize - 1),
      textAlign: 'center',
    },
    crewListStyle: {
      ...commonStyles.text.bold,
      fontSize: scale(fs.fontSize - 1),
      justifyContent: 'center',
      alignSelf: 'center',
      color: colors.darkGrey,
      marginTop: scale(8),
      marginLeft: scale(16),
      marginRight: scale(16),
      marginBottom: scale(16),
    },
    emailStyle: {
      ...commonStyles.text.regular,
      fontSize: scale(fs.fontSize - 1),
      justifyContent: 'center',
      alignSelf: 'center',
      color: colors.darkGrey,
      marginTop: scale(10),
      marginLeft: scale(16),
      marginRight: scale(16),
      marginBottom: scale(2),
    },
    submitEmailStyles: {
      flexDirection: 'column',
      alignContent: 'center',
      position: 'absolute',
      bottom: 0,
      width: '100%',
      backgroundColor: colors.white,
      zIndex: 5,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.51,
      shadowRadius: 13.16,
      elevation: 20,
    },
    continueStyle: {
      borderRadius: 5,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: scale(2),
      marginBottom: scale(10) + layout.safeMarginBottom,
      marginLeft: scale(16),
      marginRight: scale(16),
      height: scale(45),
      backgroundColor: colors.link,
    },
    continueTextStyle: {
      fontSize: scale(16),
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      padding: scale(5),
    },
    overlay: {
      flex: 1,
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      opacity: 0.95,
      backgroundColor: colors.white,
      zIndex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendText: {
      ...commonStyles.text.regular,
      color: colors.black,
      fontSize: scale(fs.fontSize + 1),
    },
    titleStyle: {
      ...commonStyles.text.regular,
      color: colors.link,
      fontSize: 20,
      marginRight: 12,
      marginBottom: 10,
    },
    titleImageStyle: {
      height: '100%',
      width: '100%',
    },
    positionViewLineThrough: {
      color: colors.white,
      textDecorationLine: 'line-through',
      fontSize: scale(10),
    },
    listItemInfoViewContainer: {
      flexDirection: 'column',
      marginLeft: scale(4),
      flexGrow: 1,
      flexShrink: 1,
    },
    listItemExtraInfoContainer: {
      flexDirection: 'column',
      flex: 1,
    },
    listItemPositionAreaContainer: {
      flexDirection: 'column',
      justifyContent: 'space-between',
      flexGrow: 0,
      flexShrink: 0,
    },
    swapViewItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: scale(8),
      marginTop: scale(16),
      marginBottom: scale(16),
      marginLeft: scale(8),
      borderRadius: scale(4),
      borderWidth: scale(2),
      flexGrow: 2,
      height: scale(56),
    },
    percentageViewContainer: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      alignContent: 'center',
      justifyContent: 'center',
    },
    percentageViewBarViewContainer: {
      height: scale(36),
      width: scale(32),
      marginTop: scale(9),
      marginBottom: scale(5),
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-end',
      borderRadius: scale(2),
    },
    percentageViewBarViewBG: {
      position: 'absolute',
      backgroundColor: '#c9cbcc',
      width: scale(32),
      height: scale(36),
      borderRadius: scale(2),
    },
    percentageViewBarView: {
      position: 'absolute',
      width: scale(32),
      bottom: 0,
      borderRadius: scale(2),
    },
    percentageViewBarViewText: {
      position: 'absolute',
      bottom: 0,
      color: colors.white,
    },
    passengerLoadingViewTitleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingLeft: scale(16),
      paddingRight: scale(16),
      paddingTop: scale(8),
      paddingBottom: scale(8),
    },
    passengerLoadingViewContainer: {
      height: scale(1),
      backgroundColor: '#c6c2c1',
      marginLeft: scale(16),
      marginRight: scale(16),
    },
    passengerLoadingViewInfoViewContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      margin: scale(16),
    },
    passengerLoadingViewPercentageViewContainer: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginLeft: scale(8),
    },
    submitFailText: {
      width: scale(180),
      textAlign: 'center',
    },
    sectionListContainer: {
      height: 9999,
      position: 'absolute',
    },
    sectionListContentContainer: {
      flexGrow: 0,
    },
    hotelViewContainer: {
      flexDirection: 'row',
      textAlign: 'left',
      flexWrap: 'wrap',
    },
    scrollViewContainer: {
      flexGrow: 1,
      backgroundColor: colors.highLightGrey,
    },
    icon: {
      width: scale(24),
      height: scale(24),
    },
  });
};

CrewListScreen.propTypes = {
  fontSizeKey: PropTypes.string,
  galacxyId: PropTypes.string,
  flightInfo: PropTypes.object,
  flightInfoSearch: PropTypes.object,
  rosters: PropTypes.array,
  updateCrewPosConfirmAction: PropTypes.func,
  updatePaChangeAction: PropTypes.func,
  updateIsmViewPositionVersion: PropTypes.func,
  logViewCommon: PropTypes.func,
};

HotelInfo.propTypes = {
  origin: PropTypes.string,
  destination: PropTypes.string,
  arrivalHotel: PropTypes.string,
  departureHotel: PropTypes.string,
  arrivalIsHome: PropTypes.bool,
  departureIsHome: PropTypes.bool,
  styles: PropTypes.object,
};

export default connect(mapStateToProps, {
  updateCrewPosConfirmAction,
  updatePaChangeAction,
  updateIsmViewPositionVersion,
  logViewCommon,
})(CrewListScreen);
