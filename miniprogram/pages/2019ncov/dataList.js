// miniprogram/pages/2019ncov/dataList.js
function getTimeDesc(dateTimeStamp) {
  if (diffValue < 0) {
    return '今天'
  }
  const minute = 1000 * 60 //把分，时，天，周，半个月，一个月用毫秒表示
  const now = new Date().getTime() //获取当前时间毫秒
  const diffValue = now - dateTimeStamp //时间差

  if (diffValue <= minute) {
    return '刚刚'
  }
  const minC = diffValue / minute //计算时间差的分，时，天，周，月
  if (minC >= 1 && minC < 60) {
    return parseInt(minC) + '分钟前'
  }
  const hour = minute * 60
  const hourC = diffValue / hour
  if (hourC >= 1 && hourC < 24) {
    return parseInt(hourC) + '小时前'
  }
  const day = hour * 24
  const dayC = diffValue / day
  if (dayC >= 1 && dayC < 7) {
    return parseInt(dayC) + '天前'
  }
  const Nyear = dateTimeStamp.getFullYear()
  const Nmonth =
    dateTimeStamp.getMonth() + 1 < 10
      ? '0' + (dateTimeStamp.getMonth() + 1)
      : dateTimeStamp.getMonth() + 1
  const Ndate =
    dateTimeStamp.getDate() < 10
      ? '0' + dateTimeStamp.getDate()
      : dateTimeStamp.getDate()
  return Nyear + '-' + Nmonth + '-' + Ndate
}

function getTableNodes(dbRes) {
  const nodes = [
    {
      name: 'tr',
      children: [
        {
          name: 'th',
          attrs: { class: 'td', style: 'background-color: #e3e7f3' },
          children: [{ type: 'text', text: '地区' }]
        },
        {
          name: 'th',
          attrs: { class: 'td', style: 'background-color: #f3bab0' },
          children: [{ type: 'text', text: '确诊' }]
        },
        {
          name: 'th',
          attrs: { class: 'td', style: 'background-color: #b4c0d5' },
          children: [{ type: 'text', text: '死亡' }]
        },
        {
          name: 'th',
          attrs: { class: 'td', style: 'background-color: #6c9' },
          children: [{ type: 'text', text: '治愈' }]
        }
      ]
    }
  ]
  nodes.push(
    ...dbRes.map(({ _id, confirmedSum, deathSum, curedSum }) => ({
      name: 'tr',
      children: [
        {
          name: 'td',
          attrs: { class: 'td-title' },
          children: [{ type: 'text', text: _id.toString() }]
        },
        {
          name: 'td',
          attrs: { class: 'td' },
          children: [{ type: 'text', text: confirmedSum.toString() }]
        },
        {
          name: 'td',
          attrs: { class: 'td' },
          children: [{ type: 'text', text: deathSum.toString() }]
        },
        {
          name: 'td',
          attrs: { class: 'td' },
          children: [{ type: 'text', text: curedSum.toString() }]
        }
      ]
    }))
  )
  return [
    {
      name: 'table',
      attrs: { class: 'table' },
      children: nodes
    }
  ]
}

function getArticles(dbRes) {
  return dbRes.map(item => ({
    ...item,
    time:
      (item.time.getHours() < 10
        ? '0' + item.time.getHours()
        : item.time.getHours()) +
      ':' +
      (item.time.getMinutes() < 10
        ? '0' + item.time.getMinutes()
        : item.time.getMinutes()),
    timeDesc: getTimeDesc(item.time)
  }))
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    dataTable: [
      {
        name: 'table',
        attrs: { class: 'table' },
        children: [
          {
            name: 'tr',
            children: [
              {
                name: 'th',
                attrs: {
                  class: 'td-title',
                  style: 'background-color: #e3e7f3'
                },
                children: [{ type: 'text', text: '地区' }]
              },
              {
                name: 'th',
                attrs: { class: 'td', style: 'background-color: #f3bab0' },
                children: [{ type: 'text', text: '确诊' }]
              },
              {
                name: 'th',
                attrs: { class: 'td', style: 'background-color: #b4c0d5' },
                children: [{ type: 'text', text: '死亡' }]
              },
              {
                name: 'th',
                attrs: { class: 'td', style: 'background-color: #6c9' },
                children: [{ type: 'text', text: '治愈' }]
              }
            ]
          }
        ]
      }
    ],
    articles: [],
    loadingMore: true,
    noMore: false,
    timeUpbound: null
  },

  updateTable: function() {
    const db = wx.cloud.database()
    const $ = db.command.aggregate
    db.collection('information')
      .aggregate()
      .group({
        _id: '$district',
        confirmedSum: $.sum('$newConfirmed'),
        deathSum: $.sum('$newDeath'),
        curedSum: $.sum('$newCured')
      })
      .sort({ confirmedSum: -1 })
      .end({
        success: res => {
          this.setData({
            dataTable: getTableNodes(res.list)
          })
        },
        fail: function(err) {
          wx.showToast({
            title: '网络错误',
            icon: 'none',
            duration: 2000
          })
          console.error(err)
        }
      })
  },

  updateArticles: function() {
    const db = wx.cloud.database()
    db.collection('article')
      .aggregate()
      .sort({ time: -1 })
      .limit(10)
      .end({
        success: res => {
          const articles = getArticles(res.list)
          this.setData({
            articles,
            loadingMore: false
          })
          if (articles.length < 10) {
            this.setData({ noMore: true })
          }
          this.timeUpbound = res.list[articles.length - 1].time
        },
        fail: err => {
          wx.showToast({
            title: '网络错误',
            icon: 'none',
            duration: 2000
          })
          this.setData({ loadingMore: false })
          console.error(err)
        }
      })
  },

  loadMore: function() {
    this.setData({ loadingMore: true })
    const db = wx.cloud.database()
    const $ = db.command.aggregate
    db.collection('article')
      .aggregate()
      .addFields({
        matched: $.lt([
          '$time',
          $.dateFromString({ dateString: this.timeUpbound.toJSON() })
        ])
      })
      .match({ matched: true })
      .sort({ time: -1 })
      .limit(10)
      .end({
        success: res => {
          const { articles } = this.data
          const newArticles = getArticles(res.list)
          this.setData({
            articles: [...articles, ...newArticles],
            loadingMore: false
          })
          if (newArticles.length < 10) {
            this.setData({ noMore: true })
          }
          this.timeUpbound = res.list[newArticles.length - 1].time
        },
        fail: err => {
          wx.showToast({
            title: '网络错误',
            icon: 'none',
            duration: 2000
          })
          this.setData({ loadingMore: false })
          console.error(err)
        }
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
    this.updateTable()
    this.updateArticles()
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    if (!this.data.noMore) this.loadMore()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return {
      title: '泰州疫情地区分布',
      imageUrl:
        'https://6e63-ncov-taizhou-1301214227.tcb.qcloud.la/%E6%B3%B0%E5%B7%9E%E7%96%AB%E6%83%85.jpg?sign=7c64b45578baa71537bf413fe698dbcb&t=1581102765',
      path: '/pages/2019ncov/2019ncov'
    }
  }
})
