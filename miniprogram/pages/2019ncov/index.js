// miniprogram/pages/2019ncov.js
import * as echarts from '../../components/ec-canvas/echarts'
import geoJson from './mapData'

function getMapOption(dbRes) {
  return {
    visualMap: {
      type: 'piecewise',
      pieces: [{ gt: 9 }, { gt: 7, lte: 9 }, { gte: 3, lte: 7 }, { lt: 3 }],
      right: '10%',
      bottom: '10%',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 10
      }
    },
    series: [
      {
        type: 'map',
        left: '20%',
        height: '90%',
        silent: true,
        mapType: 'taizhou',
        label: {
          show: true,
          fontSize: 10
        },
        data: dbRes.map(e => ({
          name: e._id,
          value: e.confirmedSum
        })),
        animation: false
      }
    ]
  }
}

function getTotalLineOption(dbRes) {
  const totalLineData = ['确诊', '死亡', '治愈'].map(name => ({
    name,
    data: [],
    type: 'line',
    symbol: 'circle',
    smooth: true,
    animation: false
  }))
  const total = {
    confirmedSum: 0,
    deathSum: 0,
    curedSum: 0
  }
  for (const element of dbRes) {
    const { _id, confirmedSum, deathSum, curedSum } = element
    total.confirmedSum += confirmedSum
    total.deathSum += deathSum
    total.curedSum += curedSum
    totalLineData[0].data.push({
      name: _id,
      value: [_id, total.confirmedSum]
    })
    totalLineData[1].data.push({
      name: _id,
      value: [_id, total.deathSum]
    })
    totalLineData[2].data.push({
      name: _id,
      value: [_id, total.curedSum]
    })
  }
  return {
    grid: {
      containLabel: true,
      top: '18%',
      bottom: '8%',
      left: '6%'
    },
    legend: {
      top: '4%',
      right: '10%',
      data: ['确诊', '死亡', '治愈']
    },
    xAxis: {
      type: 'time',
      axisLine: { show: false },
      axisLabel: {
        formatter: value => new Date(value).toISOString().slice(5, 10)
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false }
    },
    series: totalLineData
  }
}

function getNewLineOption(dbRes) {
  const newLineData = ['新增确诊', '新增死亡', '新增治愈'].map(name => ({
    name,
    data: [],
    type: 'line',
    symbol: 'circle',
    smooth: true,
    animation: false
  }))
  for (const element of dbRes) {
    const { _id, confirmedSum, deathSum, curedSum } = element
    newLineData[0].data.push({
      name: _id,
      value: [_id, confirmedSum]
    })
    newLineData[1].data.push({
      name: _id,
      value: [_id, deathSum]
    })
    newLineData[2].data.push({
      name: _id,
      value: [_id, curedSum]
    })
  }
  return {
    grid: {
      containLabel: true,
      top: '18%',
      bottom: '8%',
      left: '6%'
    },
    legend: {
      top: '4%',
      right: '10%',
      data: ['新增确诊', '新增死亡', '新增治愈']
    },
    xAxis: {
      type: 'time',
      axisLine: { show: false },
      axisLabel: {
        formatter: value => new Date(value).toISOString().slice(5, 10)
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false }
    },
    series: newLineData
  }
}

function updateMap() {
  const { mapChart } = getApp().globalData
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  db.collection('information')
    .aggregate()
    .group({
      _id: '$district',
      confirmedSum: $.sum('$newConfirmed')
    })
    .end({
      success: res => {
        mapChart.setOption(getMapOption(res.list))
      },
      fail: function(err) {
        mapChart.setOption(getMapOption([]))
        wx.showToast({
          title: '网络错误',
          icon: 'none',
          duration: 2000
        })
        console.error(err)
      }
    })
}

function updateTotalLine() {
  const { totalLineChart } = getApp().globalData
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  db.collection('information')
    .aggregate()
    .group({
      _id: '$time',
      confirmedSum: $.sum('$newConfirmed'),
      deathSum: $.sum('$newDeath'),
      curedSum: $.sum('$newCured')
    })
    .sort({ _id: 1 })
    .limit(100)
    .end({
      success: res => {
        totalLineChart.setOption(getTotalLineOption(res.list))
      },
      fail: function(err) {
        totalLineChart.setOption(getTotalLineOption([]))
        wx.showToast({
          title: '网络错误',
          icon: 'none',
          duration: 2000
        })
        console.error(err)
      }
    })
}

function updateNewLine() {
  const { newLineChart } = getApp().globalData
  const db = wx.cloud.database()
  const $ = db.command.aggregate
  db.collection('information')
    .aggregate()
    .group({
      _id: '$time',
      confirmedSum: $.sum('$newConfirmed'),
      deathSum: $.sum('$newDeath'),
      curedSum: $.sum('$newCured')
    })
    .sort({ _id: 1 })
    .limit(100)
    .end({
      success: res => {
        newLineChart.setOption(getNewLineOption(res.list))
      },
      fail: err => {
        newLineChart.setOption(getNewLineOption([]))
        wx.showToast({
          title: '网络错误',
          icon: 'none',
          duration: 2000
        })
        console.error(err)
      }
    })
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    confirmedSum: '...',
    deathSum: '...',
    curedSum: '...',
    ecMap: {
      onInit: function(canvas, width, height) {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height
        })
        canvas.setChart(chart)
        echarts.registerMap('taizhou', geoJson)
        getApp().globalData.mapChart = chart
        updateMap()
        return chart
      }
    },
    ecTotalLine: {
      onInit: function(canvas, width, height) {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height
        })
        canvas.setChart(chart)
        getApp().globalData.totalLineChart = chart
        updateTotalLine()
        return chart
      }
    },
    ecNewLine: {
      onInit: function(canvas, width, height) {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height
        })
        canvas.setChart(chart)
        getApp().globalData.newLineChart = chart
        updateNewLine()
        return chart
      }
    }
  },

  firstIn: true,

  updateTotalData: function() {
    const db = wx.cloud.database()
    const $ = db.command.aggregate
    db.collection('information')
      .aggregate()
      .group({
        _id: 1,
        confirmedSum: $.sum('$newConfirmed'),
        deathSum: $.sum('$newDeath'),
        curedSum: $.sum('$newCured')
      })
      .end({
        success: res => {
          this.setData({
            confirmedSum: res.list[0].confirmedSum,
            deathSum: res.list[0].deathSum,
            curedSum: res.list[0].curedSum
          })
        },
        fail: err => {
          wx.showToast({
            title: '网络错误',
            icon: 'none',
            duration: 2000
          })
          console.error(err)
        }
      })
  },

  showDataSrcState: function() {
    wx.showModal({
      title: '数据说明',
      content: '数据来源于微信公众号“微泰州”的每日疫情通报',
      showCancel: false,
      confirmText: '好的',
      confirmColor: '#1cbbb4'
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.startPullDownRefresh()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    if (this.firstIn) {
      this.firstIn = false
    } else {
      updateMap()
      updateTotalLine()
      updateNewLine()
    }
    this.updateTotalData()
    wx.stopPullDownRefresh()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return {
      title: '泰州疫情地区分布',
      imageUrl:
        'https://6e63-ncov-taizhou-1301214227.tcb.qcloud.la/%E6%B3%B0%E5%B7%9E%E7%96%AB%E6%83%85.jpg?sign=7c64b45578baa71537bf413fe698dbcb&t=1581102765'
    }
  }
})
