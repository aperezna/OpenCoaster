// Mock react-native to avoid native bridge dependency
'use strict';

const React = require('react');

function mockElement(type) {
  return function (props) {
    const { children, style, ...rest } = props || {};
    return React.createElement(type, rest, children);
  };
}

const ScrollViewComponent = React.forwardRef(function (props, ref) {
  const { children, style, ...rest } = props || {};

  React.useImperativeHandle(ref, function () {
    return {
      scrollTo: function () {},
    };
  });

  return React.createElement('ScrollView', rest, children);
});

const AnimatedValue = function (val) {
  this._value = val;
};
AnimatedValue.prototype.setValue = function (v) {
  this._value = v;
};
AnimatedValue.prototype.interpolate = function () {
  return { _value: this._value };
};

const FlatListComponent = React.forwardRef(function (props, ref) {
  const { data, renderItem, keyExtractor, ListEmptyComponent, ...rest } = props || {};
  const items = (data || []).map(function (item, index) {
    const key = keyExtractor ? keyExtractor(item, index) : String(index);
    return React.createElement(
      'FlatListItem',
      { key: key },
      renderItem ? renderItem({ item: item, index: index }) : null,
    );
  });
  var content;
  if (items.length > 0) {
    content = items;
  } else if (ListEmptyComponent) {
    content = React.createElement(
      'FlatListEmpty',
      null,
      typeof ListEmptyComponent === 'function'
        ? React.createElement(ListEmptyComponent)
        : ListEmptyComponent,
    );
  }
  return React.createElement('FlatList', rest, content);
});

module.exports = {
  View: mockElement('View'),
  Text: mockElement('Text'),
  ScrollView: ScrollViewComponent,
  Image: mockElement('Image'),
  ActivityIndicator: mockElement('ActivityIndicator'),
  FlatList: FlatListComponent,
  TextInput: mockElement('TextInput'),
  TouchableOpacity: mockElement('TouchableOpacity'),
  TouchableHighlight: mockElement('TouchableHighlight'),
  StyleSheet: {
    create: function (styles) {
      return styles;
    },
    flatten: function (style) {
      return style;
    },
    hairlineWidth: 0.5,
    absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  },
  Platform: {
    OS: 'ios',
    select: function (obj) {
      return obj.ios || obj.default;
    },
  },
  Dimensions: {
    get: function () {
      return { width: 390, height: 844 };
    },
    addEventListener: function () {
      return { remove: function () {} };
    },
    removeEventListener: function () {},
  },
  Animated: {
    View: mockElement('AnimatedView'),
    Text: mockElement('AnimatedText'),
    ScrollView: mockElement('AnimatedScrollView'),
    createAnimatedComponent: function (comp) {
      return comp;
    },
    timing: function () {
      return { start: function () {}, stop: function () {} };
    },
    spring: function () {
      return { start: function () {}, stop: function () {} };
    },
    loop: function () {
      return { start: function () {}, stop: function () {} };
    },
    sequence: function () {
      return { start: function () {}, stop: function () {} };
    },
    Value: AnimatedValue,
  },
  I18nManager: {
    isRTL: false,
    allowRTL: function () {},
    forceRTL: function () {},
    swapLeftAndRightInRTL: function () {},
  },
  SectionList: mockElement('SectionList'),
  KeyboardAvoidingView: mockElement('KeyboardAvoidingView'),
  Keyboard: {
    addListener: function () {
      return { remove: function () {} };
    },
    removeListener: function () {},
    dismiss: function () {},
  },
  StatusBar: mockElement('StatusBar'),
  SafeAreaView: mockElement('SafeAreaView'),
  Modal: mockElement('Modal'),
  Pressable: mockElement('Pressable'),
  Switch: mockElement('Switch'),
  RefreshControl: mockElement('RefreshControl'),
  VirtualizedList: mockElement('VirtualizedList'),
  Alert: {
    alert: function () {},
  },
  NativeModules: {},
  LogBox: {
    ignoreLogs: function () {},
    ignoreAllLogs: function () {},
  },
  AppRegistry: {
    registerComponent: function () {},
    getAppKeys: function () {
      return [];
    },
    runApplication: function () {},
    unmountApplicationComponentAtRootTag: function () {},
  },
  YellowBox: {
    ignoreWarnings: function () {},
  },
  Linking: {
    openURL: function () {
      return Promise.resolve();
    },
    canOpenURL: function () {
      return Promise.resolve(false);
    },
    addEventListener: function () {
      return { remove: function () {} };
    },
    removeEventListener: function () {},
  },
  PixelRatio: {
    get: function () {
      return 2;
    },
    getFontScale: function () {
      return 1;
    },
    getPixelSizeForLayoutSize: function (s) {
      return s;
    },
    roundToNearestPixel: function (s) {
      return s;
    },
    startDetecting: function () {},
  },
  Appearance: {
    getColorScheme: function () {
      return 'light';
    },
    addChangeListener: function () {
      return { remove: function () {} };
    },
  },
  useColorScheme: function () {
    return 'light';
  },
  findNodeHandle: function () {
    return 1;
  },
};
