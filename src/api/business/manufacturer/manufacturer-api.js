/**
 * ERP - 厂家管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

export const manufacturerApi = {
  /**
   * 分页查询厂家
   * @param {*} param
   * @returns
   */
  queryManufacturerList: (param) => {
    return postRequest('/manufacturer/query', param);
  },

  /**
   * 添加厂家
   * @param {*} param
   * @returns
   */
  addManufacturer: (param) => {
    return postRequest('/manufacturer/add', param);
  },

  /**
   * 更新厂家
   * @param {*} param
   * @returns
   */
  updateManufacturer: (param) => {
    return postRequest('/manufacturer/update', param);
  },

  /**
   * 删除厂家
   * @param {*} manufacturerId
   * @returns
   */
  deleteManufacturer: (manufacturerId) => {
    return getRequest(`/manufacturer/delete/${manufacturerId}`);
  },

  /**
   * 批量删除厂家
   * @param {*} manufacturerIdList
   * @returns
   */
  batchDelete: (manufacturerIdList) => {
    return postRequest('/manufacturer/batchDelete', manufacturerIdList);
  },

  /**
   * 导出厂家数据
   * @returns
   */
  exportManufacturer: () => {
    return getDownload('/manufacturer/export');
  },

  /**
   * 导入厂家数据
   * @param {*} file
   * @returns
   */
  importManufacturer: (file) => {
    return postRequest('/manufacturer/import', file);
  },

  /**
   * 下载导入模板
   * @returns
   */
  downloadTemplate: () => {
    return getDownload('/manufacturer/downloadTemplate');
  },
};