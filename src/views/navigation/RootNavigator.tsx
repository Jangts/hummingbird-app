import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { createStackNavigator } from '@react-navigation/stack'

import { useSelector } from 'react-redux'

import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { RootState } from '../../store/rootReducer'
import defaultScreenOptions from '../defaultScreenOptions'
import { useColors } from '../../theme/themeHooks'
import MainTabs from './main/MainTabs'
import HotspotAssertLocationNavigator from './features/HotspotAssertNavigator'
import HotspotSetupNavigator from './features/HotspotSetupNavigator'
import HotspotSetWiFiNavigator from './features/HotspotSetWiFiNavigator'
import WelcomeScreen from '../auxiliary/login/WelcomeScreen'
import CreateHeliumAccountScreen from '../auxiliary/login/CreateHeliumAccountScreen'
import EnterExplorationCodeScreen from '../auxiliary/login/EnterExplorationCodeScreen'
import { LoginStackParamList } from './loginNavigationTypes'
import ActivityScreen from '../main/account/ActivityScreen'
import LockScreen from '../auxiliary/LockScreen'
import HotspotScreen from '../main/hotspots/HotspotScreen'

const LoginStack = createStackNavigator<LoginStackParamList>()
const RootStack = createStackNavigator()
// const RootStack = createNativeStackNavigator()

const RootNavigator = () => {
  const { isWatcher, walletLinkToken } = useSelector(
    (state: RootState) => state.app.user,
  )
  const colors = useColors()
  // const { surfaceContrast, white } = colors

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  if (!isWatcher && !walletLinkToken) {
    return (
      <LoginStack.Navigator
        headerMode="none"
        screenOptions={defaultScreenOptions}
        options={{ gestureEnabled: false }}
      >
        <LoginStack.Screen name="Welcome" component={WelcomeScreen} />
        <LoginStack.Screen
          name="TypeInExplorationCode"
          component={EnterExplorationCodeScreen}
        />
        <LoginStack.Screen
          name="CreateHeliumAccount"
          component={CreateHeliumAccountScreen}
        />
      </LoginStack.Navigator>
    )
  }

  return (
    <RootStack.Navigator
      // headerMode="none"
      screenOptions={({ route }) => {
        if (route.name === 'LockScreen')
          // 锁频模式下，禁用掉手势
          return { ...defaultScreenOptions, gestureEnabled: false }

        if (Platform.OS === 'android') return defaultScreenOptions
        return {}
      }}
    >
      <RootStack.Screen
        name="MainTabs"
        options={{ headerShown: false }}
        component={MainTabs}
      />

      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen
          name="HotspotSetup"
          component={HotspotSetupNavigator}
        />
        <RootStack.Screen
          name="HotspotAssert"
          component={HotspotAssertLocationNavigator}
        />
        <RootStack.Screen
          name="HotspotSetWiFi"
          component={HotspotSetWiFiNavigator}
        />
      </RootStack.Group>
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="ActivityScreen" component={ActivityScreen} />
        <RootStack.Screen name="HotspotScreen" component={HotspotScreen} />
        <RootStack.Screen name="LockScreen" component={LockScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  )
}

export default RootNavigator
