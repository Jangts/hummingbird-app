/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Linking, Platform, ScrollView, Text } from 'react-native'
import { useSelector } from 'react-redux'
import { BottomSheet, ButtonGroup, ListItem } from 'react-native-elements'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHotspotBle } from '@helium/react-native-sdk'
import { useAsync } from 'react-async-hook'
import { Hotspot, Witness } from '@helium/http'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ColorSchemeName, useColorScheme } from 'react-native-appearance'
import Box from '../../../components/Box'
import ThemedText from '../../../components/Text'
import IconLocation from '../../../assets/images/location.svg'
import IconMaker from '../../../assets/images/maker.svg'
import IconElevation from '../../../assets/images/gain.svg'
import IconGain from '../../../assets/images/elevation.svg'
import IconAddress from '../../../assets/images/address-symbol.svg'
import IconAccount from '../../../assets/images/account-green.svg'
import IconRewardsScale from '../../../assets/images/rewardsScale.svg'
import IconBlcok from '../../../assets/images/data.svg'
import { locale } from '../../../utils/i18n'
import ActivitiesList from '../../../widgets/main/ActivitiesList/ListContainer'
import { useColors } from '../../../theme/themeHooks'
import { getLocationPermission } from '../../../store/app/locationSlice'
import { RootState } from '../../../store/rootReducer'
import usePermissionManager from '../../../utils/hooks/usePermissionManager'
import { useAppDispatch } from '../../../store/store'
import useAlert from '../../../utils/hooks/useAlert'
// import { getSecureItem, setSecureItem } from '../../../utils/secureAccount'
import RewardsStatistics from '../../../widgets/main/RewardsStatistics'
import HotspotLocationView from '../../../widgets/main/HotspotLocationView'
import { fetchHotspotDetail } from '../../../store/data/hotspotsSlice'
import { reverseGeocode } from '../../../utils/location'
import {
  formatHotspotName,
  formatHotspotNameArray,
  truncateAddress,
  useMaker,
} from '../../../utils/formatter'
import { RootStackParamList } from '../../navigation/naviTypes'
import DetailViewContainer from '../../../widgets/main/DetailViewContainer'
import BottomActionsModal from '../../../widgets/modals/BottomActionsModal'

type Route = RouteProp<RootStackParamList, 'HotspotScreen'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HotspotDetailScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const colorScheme: ColorSchemeName = useColorScheme()
  const insets = useSafeAreaInsets()
  const { address } = useRoute<Route>().params
  const { enable, getState } = useHotspotBle()
  const { showOKCancelAlert } = useAlert()
  const dispatch = useAppDispatch()
  const { requestLocationPermission } = usePermissionManager()
  const { getMakerName } = useMaker()
  const { permissionResponse, locationBlocked } = useSelector(
    (state: RootState) => state.location,
  )
  const { hotspotsData } = useSelector((state: RootState) => state.hotspots)
  const [hotspotData, setHotspotData] = useState<Hotspot>(
    hotspotsData[address]?.hotspot || undefined,
  )
  const [witnessedData, setWitnessedData] = useState<Witness[]>([])
  const [selectedIndex, updateIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [locationName, setLocationName] = useState('')

  // useEffect(() => navigation.setOptions({ title }), [navigation, title])
  useEffect(() => {
    getState()
    dispatch(getLocationPermission())
    dispatch(fetchHotspotDetail(address))
  }, [address, dispatch, getState])

  useEffect(() => {
    if (hotspotsData[address]) {
      const { hotspot, witnessed } = hotspotsData[address]
      // console.log('HotspotDetailScreen::witnessed:', witnessed)
      setHotspotData(hotspot)
      setWitnessedData(witnessed)
    }
  }, [address, hotspotsData])

  useAsync(async () => {
    if (hotspotData) {
      const hotspot = hotspotData as unknown as Hotspot & {
        locationName: string
      }
      if ((hotspot as unknown as { locationName: string }).locationName) {
        setLocationName(
          (hotspot as unknown as { locationName: string }).locationName,
        )
      } else if (hotspot.geocode) {
        const { longStreet, longCity } = hotspot.geocode
        setLocationName(
          longStreet && longCity ? `${longStreet}, ${longCity}` : 'Loading...',
        )
        const { lat, lng } = hotspot
        if (lat && lng) {
          const [{ street, city }] = await reverseGeocode(lat, lng)
          if (street && city) {
          }
          setLocationName(`${street}, ${city}`)
        }
      }
    }
  }, [hotspotData])

  const checkBluetooth = useCallback(async () => {
    const state = await getState()

    if (state === 'PoweredOn') {
      return true
    }

    if (Platform.OS === 'ios') {
      if (state === 'PoweredOff') {
        const decision = await showOKCancelAlert({
          titleKey: 'hotspot_setup.pair.alert_ble_off.title',
          messageKey: 'hotspot_setup.pair.alert_ble_off.body',
          okKey: 'generic.go_to_settings',
        })
        if (decision) Linking.openURL('App-Prefs:Bluetooth')
      } else {
        const decision = await showOKCancelAlert({
          titleKey: 'hotspot_setup.pair.alert_ble_off.title',
          messageKey: 'hotspot_setup.pair.alert_ble_off.body',
          okKey: 'generic.go_to_settings',
        })
        if (decision) Linking.openURL('app-settings:')
      }
    }
    if (Platform.OS === 'android') {
      await enable()
      return true
    }
  }, [enable, getState, showOKCancelAlert])

  const checkLocation = useCallback(async () => {
    if (Platform.OS === 'ios') return true

    if (permissionResponse?.granted) {
      return true
    }

    if (!locationBlocked) {
      const response = await requestLocationPermission()
      if (response && response.granted) {
        return true
      }
    } else {
      const decision = await showOKCancelAlert({
        titleKey: 'permissions.location.title',
        messageKey: 'permissions.location.message',
        okKey: 'generic.go_to_settings',
      })
      if (decision) Linking.openSettings()
    }
  }, [
    locationBlocked,
    permissionResponse?.granted,
    requestLocationPermission,
    showOKCancelAlert,
  ])

  const buttons = ['Statistics', 'Activity', 'Witnessed']
  const Statistics = useMemo(
    () => (
      <ScrollView
        style={{
          flex: 1,
          paddingLeft: 10,
          paddingRight: 10,
        }}
      >
        <Box
          width="100%"
          minHeight={260}
          backgroundColor="grayBoxLight"
          borderRadius="l"
        >
          <RewardsStatistics address={address} resource="hotspots" />
        </Box>
      </ScrollView>
    ),
    [address],
  )
  const Activity = useMemo(
    () =>
      hotspotData ? (
        <ActivitiesList
          address={address}
          addressType="hotspot"
          lng={hotspotData.lng || 0}
          lat={hotspotData.lat || 0}
        />
      ) : null,
    [hotspotData, address],
  )
  const Empty = useMemo(
    () =>
      witnessedData && witnessedData.length ? (
        <ScrollView
          style={{
            flex: 1,
          }}
        >
          <Box
            style={{
              backgroundColor: '#f6f6f6',
              paddingVertical: 20,
              borderRadius: 5,
            }}
          >
            {witnessedData.map((witness) => (
              <Box key={witness.address}>
                <ThemedText textAlign="center" color="gray">
                  {formatHotspotName(witness.name || 'unknow-hotspot-name')}
                </ThemedText>
                <ThemedText textAlign="center" color="gray">
                  Location: {witness.geocode?.longStreet},{' '}
                  {witness.geocode?.longCity}, {witness.geocode?.shortCountry}
                </ThemedText>
                <ThemedText textAlign="center" color="gray">
                  RewardScale: {witness.rewardScale}
                </ThemedText>
                <ThemedText textAlign="center" color="gray">
                  --------------------------------------
                </ThemedText>
              </Box>
            ))}
          </Box>
        </ScrollView>
      ) : (
        <Box
          style={{
            backgroundColor: '#f6f6f6',
            paddingVertical: 20,
            borderRadius: 5,
          }}
        >
          <ThemedText textAlign="center" color="gray">
            Empty
          </ThemedText>
        </Box>
      ),
    [witnessedData],
  )
  const widgets = [Statistics, Activity, Empty]

  const { blueMain } = useColors()

  const assertLocation = useCallback(async () => {
    if (!hotspotData) return
    setIsVisible(false)
    await checkLocation()
    navigation.push('HotspotAssert', {
      hotspot: hotspotData,
      hotspotAddress: address,
      gatewayAction: 'assertLocation',
      gain: hotspotData.gain ? hotspotData.gain / 10 : 1.2,
      elevation: hotspotData.elevation || 0,
    })
  }, [hotspotData, checkLocation, navigation, address])

  const assertAntenna = async () => {
    // console.log('HotspotDetailScreen::assertAntenna::hotspot:', hotspot)
    if (hotspotData) {
      const { lng, lat, geocode, location } = hotspotData
      if (lng && lat) {
        setIsVisible(false)
        await checkLocation()

        navigation.push('HotspotAssert', {
          hotspot: hotspotData,
          hotspotAddress: address,
          locationName,
          coords: [lng, lat],
          currentLocation: location,
          gatewayAction: 'assertAntenna',
        })
      } else {
      }
    }
  }

  const setWiFi = async () => {
    if (!hotspotData) return
    setIsVisible(false)
    await checkBluetooth()
    navigation.push('HotspotSetWiFi', {
      hotspotAddress: address,
      gatewayAction: 'setWiFi',
    })
  }
  const list = [
    {
      title: 'Assert Location And Antenna',
      onPress: assertLocation,
    },
    {
      title: 'Assert Antenna',
      onPress: assertAntenna,
    },
    {
      title: 'Update WiFi',
      onPress: setWiFi,
    },
    {
      title: 'Cancel',
      containerStyle: {
        /* backgroundColor: 'red' */
      },
      titleStyle: { color: 'gray' },
      onPress: () => setIsVisible(false),
    },
  ]

  // title: formatHotspotNameArray(hotspot.name || '').join(' '),
  //                   makerName: getMakerName(hotspot?.payer, makers),

  return (
    <DetailViewContainer
      title={formatHotspotNameArray(hotspotData?.name || '').join(' ')}
      goBack={() => {
        if (navigation.canGoBack()) {
          navigation.goBack()
        }
      }}
      icon={{ name: 'more-horiz', onPress: () => setIsVisible(true) }}
    >
      <Box flex={1}>
        <Box flex={5}>
          <HotspotLocationView
            mapCenter={
              hotspotData?.location
                ? [hotspotData.lng || 0, hotspotData.lat || 0]
                : undefined
            }
            locationName={locationName}
            assertLocation={assertLocation}
          />
        </Box>
        <Box flex={13}>
          {hotspotData ? (
            <Box flex={1}>
              <Box
                padding="s"
                backgroundColor={
                  colorScheme === 'light' ? 'primaryBackground' : 'surface'
                }
              >
                <Box
                  flexDirection="row"
                  justifyContent="flex-start"
                  alignItems="center"
                >
                  <IconAddress width={20} color={blueMain} height={20} />
                  <ThemedText
                    style={{
                      fontSize: 20,
                      color: blueMain,
                    }}
                  >
                    {truncateAddress(address, 16)}
                  </ThemedText>
                </Box>
                <Box
                  flexDirection="row"
                  justifyContent="flex-start"
                  alignItems="center"
                  marginTop="xs"
                >
                  <IconLocation width={10} height={10} color={blueMain} />
                  <ThemedText
                    flex={1}
                    variant="body2"
                    marginLeft="xs"
                    marginRight="m"
                  >
                    {locationName}
                  </ThemedText>
                  <IconRewardsScale width={10} height={10} />
                  <ThemedText variant="body2" marginLeft="xs">
                    {hotspotData.rewardScale?.toFixed(5) || '0.00'}
                  </ThemedText>
                </Box>
                <Box
                  flexDirection="row"
                  justifyContent="flex-start"
                  alignItems="center"
                  marginTop="xs"
                >
                  <IconMaker width={10} height={10} />
                  <ThemedText
                    flex={1}
                    variant="body2"
                    marginLeft="xs"
                    marginRight="m"
                  >
                    {getMakerName(hotspotData.payer)}
                  </ThemedText>
                  <IconAccount width={10} height={10} />
                  <ThemedText variant="body2" marginLeft="xs">
                    {truncateAddress(hotspotData.owner || 'UnknownOwner')}
                  </ThemedText>
                </Box>
                <Box
                  flexDirection="row"
                  justifyContent="flex-start"
                  alignItems="center"
                  marginTop="xs"
                >
                  <IconBlcok width={10} height={10} />
                  <ThemedText
                    flex={1}
                    variant="body2"
                    marginLeft="xs"
                    marginRight="m"
                  >
                    {hotspotData.block} (+{hotspotData.blockAdded || 0})
                  </ThemedText>
                  <IconElevation width={10} height={10} />
                  <ThemedText variant="body2" marginLeft="xs" marginRight="m">
                    {((hotspotData?.gain || 0) / 10).toLocaleString(locale, {
                      maximumFractionDigits: 1,
                    }) + t('antennas.onboarding.dbi')}
                  </ThemedText>
                  <IconGain width={10} height={10} />
                  <ThemedText variant="body2" marginLeft="xs">
                    {t('generic.meters', {
                      distance: hotspotData?.elevation || 0,
                    })}
                  </ThemedText>
                </Box>
              </Box>
              <Box
                flex={1}
                backgroundColor="white"
                paddingTop="s"
                borderRadius="l"
              >
                <ButtonGroup
                  onPress={updateIndex}
                  selectedIndex={selectedIndex}
                  buttons={buttons}
                  containerStyle={{ height: 36 }}
                />
                <Box
                  flex={1}
                  style={{
                    paddingTop: 5,
                    paddingBottom: insets.bottom,
                  }}
                >
                  {widgets[selectedIndex] || null}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              flex={1}
              justifyContent="center"
              style={{
                backgroundColor: '#1a2637',
              }}
            >
              <Text style={{ textAlign: 'center' }}>Loading...</Text>
            </Box>
          )}
        </Box>
        {/* <BottomSheet
          isVisible={isVisible}
          containerStyle={{ backgroundColor: 'rgba(0.5, 0.25, 0, 0.2)' }}
        >
          {list.map((l, i) => (
            <ListItem
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              containerStyle={l.containerStyle || {}}
              onPress={l.onPress}
            >
              <ListItem.Content>
                <ListItem.Title style={l.titleStyle}>{l.title}</ListItem.Title>
              </ListItem.Content>
            </ListItem>
          ))}
        </BottomSheet> */}
        <BottomActionsModal
          title="AAAAA"
          data={[]}
          modalVisible={isVisible}
          handleClose={() => setIsVisible(false)}
          maxModalHeight={0}
        />
      </Box>
    </DetailViewContainer>
  )
}

export default memo(HotspotDetailScreen)
