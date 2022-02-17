import { Hotspot } from '@helium/http'
import React, { memo, useState } from 'react'
import { Avatar, ListItem, Text } from 'react-native-elements'
// import Role from '@helium/http/build/models/Role'
import {
  getTxnIconPath,
  getTxnTypeColor,
  getTxnTypeName,
} from '../../utils/txns'
import { getHotspotActivityList } from '../../utils/appDataClient'
import useMount from '../../utils/useMount'
import Box from '../../components/Box'
// import Role from '@helium/http/build/models/Role'
// import { useSelector } from 'react-redux'
// import { HotspotData } from '@helium/http/build/models/Hotspot'
// import { Maker } from '@helium/onboarding'
// import { useTranslation } from 'react-i18next'
// import ThemedText from '../../../components/Text'
// import Box from '../../../components/Box'
// import { useAppDispatch } from '../../../store/store'
// import { fetchHotspotsData } from '../../../store/hotspots/hotspotsSlice'
// import { RootState } from '../../../store/rootReducer'
// import useMount from '../../../utils/useMount'
// import { useColors } from '../../../theme/themeHooks'
// import Location from '../../../assets/images/location.svg'
// import Signal from '../../../assets/images/signal.svg'
// import { locale } from '../../../utils/i18n'

/**
 * 获取两经纬度之间的距离
 * @param {number} e1 点1的东经, 单位:角度, 如果是西经则为负
 * @param {number} n1 点1的北纬, 单位:角度, 如果是南纬则为负
 * @param {number} e2
 * @param {number} n2
 */
const getDistance = (e1: number, n1: number, e2: number, n2: number) => {
  const R = 6371

  const { sin, cos, asin, PI, hypot } = Math

  /** 根据经纬度获取点的坐标 */

  const getPoint = (e: number, n: number) => {
    // eslint-disable-next-line no-param-reassign
    e *= PI / 180
    // eslint-disable-next-line no-param-reassign
    n *= PI / 180
    // 这里 R* 被去掉, 相当于先求单位圆上两点的距, 最后会再将这个距离放大 R 倍
    return { x: cos(n) * cos(e), y: cos(n) * sin(e), z: sin(n) }
  }

  const a = getPoint(e1, n1)
  const b = getPoint(e2, n2)
  const c = hypot(a.x - b.x, a.y - b.y, a.z - b.z)
  const r = asin(c / 2) * 2 * R

  return r / 1000
}

const m = 60
const h = m * 60
const d = h * 24
const w = d * 7
const getDuration = (t: number) => {
  const now = Date.now() / 1000
  const past = now - t
  // console.log(past)
  if (past > w) {
    return `${Math.floor(past / w)} w`
  }
  if (past > d) {
    return `${Math.floor(past / d)} d`
  }
  if (past > h) {
    return `${Math.floor(past / h)} h`
  }
  if (past > m) {
    return `${Math.floor(past / m)} m`
  }
  return 'now'
}

const ActivitiesList = ({ hotspot }: { hotspot: Hotspot }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivitiesList] = useState<Array<any>>([])
  useMount(() => {
    async function fetchActivitiesList() {
      const { cursor, data } = (await getHotspotActivityList(
        hotspot.address,
        'all',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any
      const full = (await getHotspotActivityList(
        hotspot.address,
        'all',
        cursor,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as any
      // console.log('ActivitiesList::fetchActivitiesList::preview:', data[0].fee)
      // console.log(
      //   'ActivitiesList::fetchActivitiesList::firstData::single:',
      //   data[0].type,
      //   data[0].hash,
      //   data[0],
      // )
      // console.log(
      //   'ActivitiesList::fetchActivitiesList::firstData::list:',
      //   full.data[0].type,
      //   full.data[0].hash,
      //   full.data[0],
      // )
      if (
        data[0]?.type === full.data[0]?.type &&
        data[0]?.hash === full.data[0]?.hash
      ) {
        setActivitiesList(full.data)
      } else {
        setActivitiesList([data[0], ...full.data])
      }
    }
    fetchActivitiesList()
  })

  return (
    <>
      {activities
        .filter(
          (activity) =>
            activity &&
            (activity.challenger !== hotspot.address ||
              activity.type === 'poc_request_v1' ||
              activity.type === 'assert_location_v2'),
        )
        .map((activity) => {
          const icon = getTxnIconPath(activity)
          const color = getTxnTypeColor(activity.type)
          let desc = `Height: ${activity.height}`
          if (activity.fee) {
            desc = `- ${activity.fee.floatBalance.toString() || '0'} DC`
            // console.log('balance:', desc)
          } else if (activity.totalAmount) {
            desc = `+ ${
              activity.totalAmount.floatBalance.toString() || '0'
            } HNT`
            // console.log('balance:', desc)
          } else if (
            activity.challenger !== hotspot.address &&
            activity.challengerLon !== undefined &&
            activity.challengerLat !== undefined
          ) {
            const dist = getDistance(
              activity.challengerLon || 0,
              activity.challengerLat || 0,
              hotspot.lng || 0,
              hotspot.lat || 0,
              // activity.path[0].challengeeLon || 0,
              // activity.path[0].challengeeLat || 0,
            )
            if (dist) {
              desc = `~ ${dist.toFixed(3)} km`
              // console.log('distance:', desc)
            }
          }
          return (
            <ListItem key={activity.hash} bottomDivider>
              <Avatar
                rounded
                source={{
                  uri: icon || '',
                  //   Platform.OS === 'ios'
                  //     ? icon || ''
                  //     : `asset:/icons/activity/${icon}.svg` || '',
                }}
                containerStyle={{
                  backgroundColor: 'white',
                }}
              />
              <ListItem.Content>
                <Box flexDirection="row">
                  <Box flex={1}>
                    <Text style={{ fontSize: 16, fontWeight: '500' }}>
                      {getTxnTypeName(activity.type, 'hotspot')}
                    </Text>
                    <Text style={{ fontSize: 12, color }}>{desc}</Text>
                  </Box>
                  <Box flexDirection="column" justifyContent="center">
                    <Text style={{ fontSize: 12, color }}>
                      {getDuration(activity.time)}
                    </Text>
                  </Box>
                </Box>
              </ListItem.Content>
            </ListItem>
          )
        })}
    </>
  )
}

export default memo(ActivitiesList)