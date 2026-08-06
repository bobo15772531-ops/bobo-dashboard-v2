/**
 * BOBO 발주 검수 Dashboard V1
 * 파일 헤더 및 검수 규칙
 */

const ORDER_CHECK_CONFIG = {
  title: 'BOBO 발주 검수 Dashboard V1',

  fileTypes: {
    purchase: {
      label: '발주서',

      headers: {
        confirmedDate: [
          '주문확인일'
        ],

        market: [
          '마켓'
        ],

        saleNumber: [
          '판매번호',
          '판매 번호'
        ],

        onlineOrderNumber: [
          '온라인 주문번호',
          '온라인주문번호'
        ],

        directOrderNumber: [
          '직배 주문번호',
          '직배주문번호'
        ],

        model: [
          '모델명',
          '모델'
        ],

        option: [
          '옵션'
        ],

        quantity: [
          '수량',
          '주문수량',
          '주문 수량'
        ],

        settlement: [
          '정산가'
        ],

        recipient: [
          '수령인',
          '인수자',
          '받는사람'
        ],

        productOrderNumber: [
          '상품주문번호',
          '상품 주문번호'
        ],

        orderNumber: [
          '주문번호',
          '주문 번호'
        ],

        orderDate: [
          '주문일자',
          '주문 일자'
        ]
      },

      required: [
  'orderNumber',
  'saleNumber',
  'model',
  'quantity'
]
    },

    online: {
      label: '온라인 주문',

      headers: {
        orderDate: [
          '주문일자',
          '주문 일자'
        ],

        orderNumber: [
          '주문번호',
          '주문 번호'
        ],

        saleNumber: [
          '판매번호',
          '판매 번호'
        ],

        model: [
          '모델',
          '모델명'
        ],

        quantity: [
          '수량',
          '주문수량',
          '주문 수량'
        ],

        recipient: [
          '인수자',
          '수령인',
          '받는사람'
        ],

        orderStatus: [
          '주문상태',
          '주문 상태'
        ]
      },

      required: [
        'orderNumber',
        'saleNumber',
        'model',
        'quantity'
      ]
    },

    direct: {
      label: '직배 주문',

      headers: {
        orderDate: [
          '주문일자',
          '주문 일자'
        ],

        orderNumber: [
          '주문번호',
          '주문 번호'
        ],

        saleNumber: [
          '판매번호',
          '판매 번호'
        ],

        model: [
          '모델',
          '모델명'
        ],

 quantity: [
  '주문',
  '주문수량',
  '주문 수량',
  '수량'
],
      

        amount: [
          '주문금액',
          '주문 금액'
        ],

        recipient: [
          '인수자',
          '수령인',
          '받는사람'
        ]
      },

      required: [
        'orderNumber',
        'saleNumber',
        'model',
        'quantity'
      ]
    }
  },

  matching: {
    primaryFields: [
      'saleNumber',
      'orderNumber'
    ],

    compareFields: [
      'model',
      'quantity',
      'recipient',
      'orderDate'
    ],

    modelRule: 'full-normalized'
  },

  errorTypes: {
    normal: '정상',
    onlineMissing: '온라인 누락',
    directMissing: '직배 누락',
    purchaseMissing: '발주서 누락',
    saleNumberMismatch: '판매번호 불일치',
    orderNumberMismatch: '주문번호 불일치',
    modelMismatch: '모델 불일치',
    quantityMismatch: '수량 불일치',
    duplicate: '중복 의심',
    statusCheck: '주문상태 확인 필요'
  },

  display: {
    resultLimit: 1000
  }
};
