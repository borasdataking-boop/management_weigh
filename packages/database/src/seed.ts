import { prisma } from './index';

export async function seedPmslDatabase() {
  console.log('🌱 Seeding PMSL Multi-Tenant Database (Superadmin -> Company -> Hub -> Stations)...');

  // 1. Seed Companies (Khách hàng của Superadmin)
  const compSaoTa = await prisma.company.upsert({
    where: { code: 'SAOTA-FOODS' },
    update: { name: 'Công ty CP Thực phẩm Sao Ta (FIMEX VN)' },
    create: {
      code: 'SAOTA-FOODS',
      name: 'Công ty CP Thực phẩm Sao Ta (FIMEX VN)',
      status: 'ACTIVE',
    },
  });

  const compMinhPhu = await prisma.company.upsert({
    where: { code: 'MINHPHU-SEAFOOD' },
    update: { name: 'Tập đoàn Thủy sản Minh Phú' },
    create: {
      code: 'MINHPHU-SEAFOOD',
      name: 'Tập đoàn Thủy sản Minh Phú',
      status: 'ACTIVE',
    },
  });

  // 2. Seed Hubs (Máy Hub đặt tại xưởng chế biến)
  const hubSaoTa = await prisma.hub.upsert({
    where: { code: 'HUB-XUONG-01' },
    update: {
      name: 'Máy Hub Xưởng Chế biến Sóc Trăng',
      companyId: compSaoTa.id,
      status: 'ONLINE',
      lastSeenAt: new Date(),
    },
    create: {
      code: 'HUB-XUONG-01',
      name: 'Máy Hub Xưởng Chế biến Sóc Trăng',
      companyId: compSaoTa.id,
      ipAddress: '192.168.1.100',
      status: 'ONLINE',
      lastSeenAt: new Date(),
      firmwareVersion: 'v2.1-DINI-ARGEO',
    },
  });

  const hubMinhPhu = await prisma.hub.upsert({
    where: { code: 'HUB-XUONG-02' },
    update: {
      name: 'Máy Hub Xưởng Chế biến Cà Mau',
      companyId: compMinhPhu.id,
      status: 'ONLINE',
      lastSeenAt: new Date(),
    },
    create: {
      code: 'HUB-XUONG-02',
      name: 'Máy Hub Xưởng Chế biến Cà Mau',
      companyId: compMinhPhu.id,
      ipAddress: '192.168.2.100',
      status: 'ONLINE',
      lastSeenAt: new Date(),
      firmwareVersion: 'v2.1-DINI-ARGEO',
    },
  });

  // 3. Seed Processes (15 công đoạn chế biến thủy sản chuẩn PMSL)
  const processes = [
    { processId: 'CD001', processName: 'Tiếp nhận tôm (Material Receiving)' },
    { processId: 'CD002', processName: 'Phân cỡ & Phân loại (Grading)' },
    { processId: 'CD003', processName: 'Xếp khuôn & Chia mẻ (Stacking & Divide)' },
    { processId: 'CD004', processName: 'Bóc vỏ & Rút chỉ (Peeling / EZP / Devein)' },
    { processId: 'CD005', processName: 'Ngâm phụ gia (Soaking)' },
    { processId: 'CD006', processName: 'Định hình Nobashi & Butterfly' },
    { processId: 'CD007', processName: 'Tẩm bột (Breading)' },
    { processId: 'CD008', processName: 'Chiên chín (Breaded Fry)' },
    { processId: 'CD009', processName: 'Nấu chín PD (PD Cook)' },
    { processId: 'CD010', processName: 'Nấu chín HLSO (HLSO Cook)' },
    { processId: 'CD011', processName: 'Tách vỏ sau nấu (Peel After Cook)' },
    { processId: 'CD012', processName: 'Cấp đông xoắn tươi (Raw Spiral Freezer)' },
    { processId: 'CD013', processName: 'Cấp đông xoắn chiên (Fried Spiral Freezer)' },
    { processId: 'CD014', processName: 'Cấp đông IQF tươi (Raw IQF)' },
    { processId: 'CD015', processName: 'Cấp đông IQF chín (Cook IQF)' },
  ];

  for (const p of processes) {
    await prisma.process.upsert({
      where: { processId: p.processId },
      update: { processName: p.processName },
      create: p,
    });
  }

  // 4. Seed Products
  const products = [
    { productId: 'TOM001', productName: 'Tôm nguyên liệu (Raw Shrimp)', isEnd: false },
    { productId: 'TOM002', productName: 'Tôm bán thành phẩm (WIP Shrimp)', isEnd: false },
    { productId: 'TOM003', productName: 'Tôm cấp đông thành phẩm (Frozen Output)', isEnd: true },
    { productId: 'TOM004', productName: 'Tôm chiên đóng hộp xuất khẩu (Export Finished)', isEnd: true },
  ];

  for (const prd of products) {
    await prisma.product.upsert({
      where: { productId: prd.productId },
      update: { productName: prd.productName, isEnd: prd.isEnd },
      create: prd,
    });
  }

  // 5. Seed Stations (Trạm cân kết nối đầu cân DINI ARGEO & Loadcell)
  const stations = [
    { stationId: '10244156', stationName: 'Trạm cân Tiếp nhận tôm 01', processId: 'CD001' },
    { stationId: '10244157', stationName: 'Trạm cân Phân cỡ 02', processId: 'CD002' },
    { stationId: '10244158', stationName: 'Trạm cân Xếp khuôn 03', processId: 'CD003' },
    { stationId: '10244159', stationName: 'Trạm cân Bóc vỏ 04', processId: 'CD004' },
    { stationId: '10244160', stationName: 'Trạm cân Ngâm phụ gia 05', processId: 'CD005' },
    { stationId: '10244161', stationName: 'Trạm cân Định hình 06', processId: 'CD006' },
    { stationId: '10244162', stationName: 'Trạm cân Tẩm bột 07', processId: 'CD007' },
    { stationId: '10244163', stationName: 'Trạm cân Chiên 08', processId: 'CD008' },
    { stationId: '10244164', stationName: 'Trạm cân Nấu PD 09', processId: 'CD009' },
    { stationId: '10244165', stationName: 'Trạm cân Nấu HLSO 10', processId: 'CD010' },
    { stationId: '10244166', stationName: 'Trạm cân Tách vỏ 11', processId: 'CD011' },
    { stationId: '10244167', stationName: 'Trạm cân Xoắn tươi 12', processId: 'CD012' },
    { stationId: '10244168', stationName: 'Trạm cân Xoắn chiên 13', processId: 'CD013' },
    { stationId: '10244169', stationName: 'Trạm cân IQF tươi 14', processId: 'CD014' },
    { stationId: '10244170', stationName: 'Trạm cân IQF chín 15', processId: 'CD015' },
  ];

  for (const st of stations) {
    await prisma.stationWeigh.upsert({
      where: { stationId: st.stationId },
      update: {
        stationName: st.stationName,
        processId: st.processId,
        hubId: hubSaoTa.id,
        indicatorModel: 'DINI_ARGEO',
      },
      create: {
        stationId: st.stationId,
        stationName: st.stationName,
        processId: st.processId,
        hubId: hubSaoTa.id,
        indicatorModel: 'DINI_ARGEO',
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  // 6. Seed Operators tại máy Hub
  await prisma.pmshubOperator.upsert({
    where: { username: 'admin' },
    update: { hubId: hubSaoTa.id },
    create: {
      username: 'admin',
      passwordHash: 'AQAAAAIAAYagAAAAEFkZa7ryf5qb3yhJeFfWY+H1G1D/aM9YE0l27clykJTLO40wWLe1Xkb08q4cimJq+w==',
      isActive: true,
      authVersion: 1,
      hubId: hubSaoTa.id,
    },
  });

  console.log('✅ Multi-Tenant Database seeded successfully!');
}

if (require.main === module) {
  seedPmslDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error seeding PMSL:', err);
      process.exit(1);
    });
}
