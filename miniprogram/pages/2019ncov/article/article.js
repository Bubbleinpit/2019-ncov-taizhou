// miniprogram/pages/2019ncov/article/article.js
Page({
  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function({ title, url }) {
    wx.setNavigationBarTitle({ title })
    this.setData({ url })
    wx.hideShareMenu()
  },

  copyUrl: function() {
    wx.setClipboardData({ data: this.data.url })
  }
})
