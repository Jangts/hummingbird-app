import React, { memo } from 'react'
import { ScrollView } from 'react-native'
import { Avatar, Header, ListItem, Text } from 'react-native-elements'
import { useSelector } from 'react-redux'
import { HotspotData } from '@helium/http/build/models/Hotspot'
import { Maker } from '@helium/onboarding'
import { useTranslation } from 'react-i18next'
import ThemedText from '../../../components/Text'
import Box from '../../../components/Box'
import { useAppDispatch } from '../../../store/store'
import { fetchHotspotsData } from '../../../store/hotspots/hotspotsSlice'
import { RootState } from '../../../store/rootReducer'
import useMount from '../../../utils/useMount'
import { useColors } from '../../../theme/themeHooks'
import Location from '../../../assets/images/location.svg'
import Signal from '../../../assets/images/signal.svg'
import { locale } from '../../../utils/i18n'

export const HELIUM_OLD_MAKER_ADDRESS =
  '14fzfjFcHpDR1rTH8BNPvSi5dKBbgxaDnmsVPbCjuq9ENjpZbxh'

export const HUMMINGBIRD_MAKER_ADDRESS =
  '14DdSjvEkBQ46xQ24LAtHwQkAeoUUZHfGCosgJe33nRQ6rZwPG3'

const formatHotspotName = (name: string) => {
  return name.split('-').map((str) => {
    return str.replace(/^\w/, (c) => c.toLocaleUpperCase())
  })
}

const formatHotspotTitle = (name: string) => {
  return name
    .split('-')
    .map((str) => {
      return str[0].toLocaleUpperCase()
    })
    .join('')
}

const getMakerName = (hotspot: HotspotData, makers: Maker[] | undefined) => {
  if (hotspot?.payer === HUMMINGBIRD_MAKER_ADDRESS) {
    return 'Hummingbird'
  }
  if (hotspot?.payer === HELIUM_OLD_MAKER_ADDRESS) {
    // special case for old Helium Hotspots
    return 'Helium'
  }
  return (
    makers?.find((m) => m.address === hotspot?.payer)?.name || 'Unknown Maker'
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HotspotsListScreen = ({ navigation }: any) => {
  const { t } = useTranslation()

  const { surfaceContrast } = useColors()
  // console.log('HotspotsListScreen::surfaceContrast:', surfaceContrast)

  const makers = useSelector((state: RootState) => state.heliumData.makers)
  // console.log('MyLOG::HotspotsListScreen::makers:', makers)

  const hotspots = useSelector(
    (state: RootState) => state.hotspots.hotspots.data,
  )
  // console.log('HotspotsListScreen::hotspots:', hotspots)
  const dispatch = useAppDispatch()

  useMount(() => {
    dispatch(fetchHotspotsData())
    // maybeGetLocation(false)
  })

  return (
    <Box flex={1}>
      <Header
        backgroundColor={surfaceContrast}
        centerComponent={{
          text: 'Hostpots',
          // style: { fontSize: 20, color: '#fff' },
        }}
        rightComponent={{
          icon: 'add',
          color: '#fff',
          onPress: () => {
            // console.log('rightComponent', navigation.getParent())
            navigation.navigate('HotspotSetup')
            // navigation.navigate('HotspotAssert')
          },
        }}
      />
      <Box flex={1}>
        <ScrollView>
          {hotspots.map((hotspot) => (
            <ListItem
              key={hotspot.address}
              bottomDivider
              onPress={() =>
                navigation.navigate('HotspotDetailScreen', {
                  // screen: 'HotspotDetail',
                  title: formatHotspotName(hotspot.name || '').join(' '),
                  makerName: getMakerName(hotspot, makers),
                  hotspot,
                })
              }
            >
              <Avatar
                rounded
                title={formatHotspotTitle(hotspot.name || '')}
                // containerStyle={}
                // onPress={() => console.log('Works!')}
              />
              <ListItem.Content>
                <ListItem.Title>
                  {formatHotspotName(hotspot.name || '').map((str, j) => {
                    if (j === 2) {
                      return (
                        <Text
                          // eslint-disable-next-line react/no-array-index-key
                          key={j}
                          style={{ fontSize: 22, fontWeight: '500' }}
                        >
                          {str}
                        </Text>
                      )
                    }
                    return (
                      // eslint-disable-next-line react/no-array-index-key
                      <Text key={j} style={{ fontSize: 22, fontWeight: '200' }}>
                        {str}{' '}
                      </Text>
                    )
                  })}
                </ListItem.Title>
                <Text>{getMakerName(hotspot, makers)}</Text>
                <Box
                  flexDirection="row"
                  justifyContent="flex-start"
                  alignItems="center"
                  marginTop="xs"
                  // marginBottom="m"
                  // marginLeft="m"
                  opacity={hotspot.address === undefined ? 0 : 100}
                >
                  <Location
                    width={10}
                    height={10}
                    // color={isHidden ? colors.grayLightText : colors.grayText}
                  />
                  <ThemedText
                    flex={7}
                    variant="body2"
                    // color={isHidden ? 'grayLightText' : 'grayText'}
                    marginLeft="xs"
                    marginRight="m"
                  >
                    {`${hotspot?.geocode?.longCity}, ${hotspot?.geocode?.shortCountry}`}
                  </ThemedText>
                  <Signal
                    width={10}
                    height={10}
                    // color={isHidden ? colors.grayLightText : colors.grayText}
                  />
                  <ThemedText
                    flex={2}
                    variant="body2"
                    // color={isHidden ? 'grayLightText' : 'grayText'}
                    marginLeft="xs"
                  >
                    {t('generic.meters', { distance: hotspot?.elevation || 0 })}
                  </ThemedText>
                  <ThemedText
                    flex={3}
                    variant="body2"
                    // color={isHidden ? 'grayLightText' : 'grayText'}
                    marginLeft="xs"
                    style={{
                      textAlign: 'right',
                    }}
                  >
                    {((hotspot?.gain || 0) / 10).toLocaleString(locale, {
                      maximumFractionDigits: 1,
                    }) + t('antennas.onboarding.dbi')}
                  </ThemedText>
                </Box>
              </ListItem.Content>
            </ListItem>
          ))}
        </ScrollView>
      </Box>
    </Box>
  )
}

export default memo(HotspotsListScreen)