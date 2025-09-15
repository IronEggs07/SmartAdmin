/**
 * ERP - 机器管理 APIs
 */
import { postRequest, getRequest, getDownload } from '/@/lib/axios';

/**
 * 机器管理API
 * 字段说明：
 * - machineCode: 机器编码 (varchar)
 * - machineName: 机器名称 (varchar)
 * - machineAddress: 机器地址 (varchar, 255长度)
 * - machineStatus: 机器状态 (int, 1:正常 2:故障 3:离线)
 * - extField1~extField4: 扩展字段 (int, 可选)
 * - createTime: 创建时间 (datetime)
 * - updateTime: 更新时间 (datetime)
 */
export const machineApi = {
  /**
   * 分页查询机器列表
   * @param {*} param
   * @returns
   */
  queryMachineList: (param) => {
    return postRequest('/machine/query', param);
  },

  /**
   * 添加机器
   * @param {*} param
   * @returns
   */
  addMachine: (param) => {
    return postRequest('/machine/add', param);
  },

  /**
   * 更新机器信息
   * @param {*} param
   * @returns
   */
  updateMachine: (param) => {
    return postRequest('/machine/update', param);
  },

  /**
   * 删除机器
   * @param {*} machineId
   * @returns
   */
  deleteMachine: (machineId) => {
    return getRequest(`/machine/delete/${machineId}`);
  },

  /**
   * 批量删除机器
   * @param {*} machineIdList
   * @returns
   */
  batchDelete: (machineIdList) => {
    return postRequest('/machine/batchDelete', machineIdList);
  },

  // /**
  //  * 导出机器数据
  //  * @returns
  //  */
  // exportMachine: () => {
  //   return getDownload('/machine/export');
  // },

  // /**
  //  * 导入机器数据
  //  * @param {*} file
  //  * @returns
  //  */
  // importMachine: (file) => {
  //   const formData = new FormData();
  //   formData.append('file', file);
  //   return postRequest('/machine/import', formData, {
  //     headers: {
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   });
  // }
};