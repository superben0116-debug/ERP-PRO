
import { ColumnDefinition } from './types';

export const MAIN_COLUMNS: ColumnDefinition[] = [
  { id: 'serial', label: '序号', width: 60 }, // A
  { id: 'date_out', label: '出单日期', width: 110 }, // B
  { id: 'image', label: '产品图', width: 100, type: 'image' }, // C
  { id: 'cm_label', label: '厘米', width: 80 }, // D
  { id: 'inch_label', label: '英寸', width: 80 }, // E
  { id: 'region', label: '区域', width: 80 }, // F
  { id: 'factory_model', label: '工厂内部型号', width: 130 }, // G
  { id: 'shipping_method', label: '包装/尾程方式', width: 130 }, // H
  { id: 'payment_status', label: '货款已付', width: 90 }, // I
  { id: 'shop_name', label: '店铺', width: 110 }, // J
  { id: 'order_id', label: '订单编号', width: 170 }, // K
  { id: 'internal_order_id', label: '内部订单号', width: 130 }, // L
  { id: 'product_name', label: '产品名', width: 180 }, // M
  { id: 'supplier', label: '供应商', width: 120 }, // N
  { id: 'qty', label: '采购数量', width: 70, type: 'number' }, // O
  { id: 'unit_price', label: '单价', width: 70, type: 'number' }, // P
  { id: 'total_price', label: '总价', width: 90 }, // Q
  { id: 'track_1688', label: '1688运输单号', width: 170 }, // R
  { id: 'order_date', label: '下单日期', width: 110 }, // S
  { id: 'ship_out_date', label: '供应商出货日期', width: 110 }, // T
  { id: 'hj_arrival_date', label: '到花街日期', width: 110 }, // U
  { id: 'ship_departure_date', label: '开船日期', width: 110 }, // V
  { id: 'port_arrival_date', label: '到港日期', width: 110 }, // W
  { id: 'tracking_num', label: '单号', width: 150 }, // X
  { id: 'first_leg_type', label: '头程', width: 90 }, // Y
  { id: 'last_leg_type', label: '尾程', width: 90 }, // Z
  { id: 'sets_count', label: '套数', width: 70 }, // AA
  { id: 'sets_per_box', label: '每箱套数', width: 80 }, // AB
  { id: 'total_boxes', label: '总箱数', width: 80 }, // AC
  { id: 'box_specs', label: '货代箱规', width: 120 }, // AD
  { id: 'billing_weight', label: '计费重量', width: 90 }, // AE
  { id: 'hj_unit_price', label: '花街单价', width: 80 }, // AF
  { id: 'first_leg_total', label: '头程运费总价', width: 110 }, // AG
  { id: 'pack_fee', label: '包材费', width: 80 }, // AH
  { id: 'outbound_fee', label: '出库费', width: 80 }, // AI
  { id: 'domestic_freight', label: '国内运费', width: 90 }, // AJ
  { id: 'other_fee', label: '其他', width: 80 }, // AK
  { id: 'shipping_cost_per_set', label: '每套运费成本', width: 110 }, // AL
  { id: 'weight_kg', label: '毛重小于68kg', width: 110 }, // AM
  { id: 'len_cm', label: '长cm', width: 70 }, // AN
  { id: 'width_cm', label: '宽cm', width: 70 }, // AO
  { id: 'height_cm', label: '高cm', width: 70 }, // AP
  { id: 'len_in', label: '长in', width: 70 }, // AQ
  { id: 'width_in', label: '宽in', width: 70 }, // AR
  { id: 'height_in', label: '高in', width: 70 }, // AS
  { id: 'weight_lb', label: '镑重量', width: 90 }, // AT
  { id: 'calc_vol_weight', label: '自算计费重', width: 110 }, // AU
  { id: 'customer_address', label: '客户地址', width: 280 }, // AV
  { id: 'fedex_method', label: '联邦方式', width: 110 }, // AW
  { id: 'fedex_tracking', label: '联邦单号', width: 170 }, // AX
  { id: 'fedex_usd', label: '联邦美金', width: 90 }, // AY
  { id: 'rebate', label: '反弹', width: 80 }, // AZ
  { id: 'rebate_return', label: '反弹退回', width: 90 }, // BA
  { id: 'buy_shipping', label: '购买配送', width: 100 }, // BB
  { id: 'fedex_rmb', label: '联邦人民币', width: 110 }, // BC
  { id: 'total_cost', label: '总成本', width: 110 }, // BD
  { id: 'recovery', label: '回款', width: 110 }, // BE
  { id: 'profit', label: '利润', width: 110 }, // BF
  { id: 'sales_price', label: '售价', width: 90 }, // BG
  { id: 'refunded', label: '被退款', width: 90 }, // BH
  { id: 'claim_amount', label: '索赔额', width: 90 }, // BI
  { id: 'sku', label: 'SKU', width: 140 }, // BJ
  { id: 'ship_date', label: '发货日', width: 110 }, // BK
  { id: 'delivery_date', label: '送达日', width: 110 }, // BL
  { id: 'truck_tracking', label: '卡派后台单号', width: 170 }, // BM
  { id: 'oversize', label: 'oversize 130及165', width: 140 }, // BN
  { id: 'perimeter', label: '周长＜419', width: 110 }, // BO
  { id: 'ship_image', label: '出货图', width: 100, type: 'image' }, // BP
  { id: 'pod', label: 'POD', width: 100, type: 'image' }, // BQ
  { id: 'sign_image', label: '签收图', width: 100, type: 'image' }, // BR
  { id: 'other_misc', label: '其他', width: 140 }, // BS
  { id: 'bill_month', label: '账单月份', width: 120 }, // BT
];

export const TRUCK_COLUMNS: ColumnDefinition[] = [
  { id: 'shipper_zip', label: 'Shipper Zip Code*', width: 140, default: '91733' },
  { id: 'pickup_date', label: 'Pickup Date*', width: 140 },
  { id: 'shipper_city', label: 'Shipper City*', width: 140, default: 'South El Monte' },
  { id: 'shipper_state', label: 'Shipper State*', width: 140, default: 'CA' },
  { id: 'shipper_country', label: 'Shipper Country*', width: 140, default: 'US' },
  { id: 'shipper_addr_type', label: 'Shipper Address Type*', width: 140, default: 'Business with dock' },
  { id: 'shipper_service', label: 'Shipper Service', width: 140 },
  { id: 'shipper_contact', label: 'Shipper Contact Name', width: 140, default: 'mike' },
  { id: 'shipper_phone', label: 'Shipper Contact Phone', width: 140, default: '567-227-7777' },
  { id: 'shipper_email', label: 'Shipper Contact Email', width: 140, default: 'chenjinrong@wedoexpress.com' },
  { id: 'shipper_addr_name', label: 'Shipper Address Name', width: 180, default: 'CHAINYO SUPPLYCHAIN MANAGEMENT INC' },
  { id: 'shipper_line1', label: 'Shipper Address Line1', width: 180, default: '1230 Santa Anita Ave' },
  { id: 'shipper_line2', label: 'Shipper Address Line2', width: 140, default: 'Unit H' },
  { id: 'pickup_from', label: 'Pickup Time From', width: 120, default: '09:30' },
  { id: 'pickup_to', label: 'Pickup Time To', width: 120, default: '17:30' },
  { id: 'order_no', label: 'Customer orderNo', width: 160 },
  { id: 'ref', label: 'Ref', width: 160 },
  { id: 'shipper_remark', label: 'Shipper Remark', width: 140 },
  { id: 'receiver_zip', label: 'Receiver Zip Code*', width: 140 },
  { id: 'receiver_city', label: 'Receiver City*', width: 140 },
  { id: 'receiver_state', label: 'Receiver State*', width: 140 },
  { id: 'receiver_country', label: 'Receiver Country*', width: 140, default: 'US' },
  { id: 'receiver_addr_type', label: 'Receiver Address Type*', width: 140, default: 'Residential' },
  { id: 'receiver_service', label: 'Receiver Service', width: 140, default: 'Lift-Gate；APPT' },
  { id: 'receiver_contact', label: 'Receiver Contact Name', width: 140 },
  { id: 'receiver_phone', label: 'Receiver Contact Phone', width: 140 },
  { id: 'receiver_email', label: 'Receiver Contact Email', width: 140, default: 'chenjinrong@wedoexpress.com' },
  { id: 'receiver_addr_name', label: 'Receiver Address Name', width: 160 },
  { id: 'receiver_line1', label: 'Receiver Address Line1', width: 180 },
  { id: 'receiver_line2', label: 'Receiver Address Line2', width: 140 },
  { id: 'delivery_from', label: 'Delivery Time From', width: 120, default: '09:00' },
  { id: 'delivery_to', label: 'Delivery Time To', width: 120, default: '16:30' },
  { id: 'receiver_remark', label: 'Receiver Remark', width: 140 },
  { id: 'size_unit', label: 'Size Unit*', width: 120, default: 'in/lb' },
  { id: 'name', label: 'Name*', width: 140, default: 'Bathroom Vanity' },
  { id: 'package_type', label: 'Package Type*', width: 140, default: 'CRATE' },
  { id: 'package_qty', label: 'Package Qty*', width: 120, default: '1' },
  { id: 'pallet_type', label: 'Pallet Type*', width: 140, default: 'PALLETS' },
  { id: 'pallet_qty', label: 'Pallet Qty*', width: 120, default: '1' },
  { id: 'declared_val', label: 'Declared($)*', width: 120 },
  { id: 'length', label: 'Length*', width: 90 },
  { id: 'width', label: 'Width*', width: 90 },
  { id: 'height', label: 'Height*', width: 90 },
  { id: 'weight', label: 'Weight*', width: 90 },
  { id: 'nmfc', label: 'NMFC', width: 90 },
  { id: 'goods_describe', label: 'Goods Describe', width: 180 },
  { id: 'box_weight', label: 'Box Weight', width: 90 },
  { id: 'box_length', label: 'Box Length', width: 90 },
  { id: 'box_width', label: 'Box Width', width: 90 },
  { id: 'box_height', label: 'Box Height', width: 90 },
  { id: 'declared_val_footer', label: 'Declared($)', width: 120 },
  { id: 'remark', label: 'Remark', width: 140 },
];
