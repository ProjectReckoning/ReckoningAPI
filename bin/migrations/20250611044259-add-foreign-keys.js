'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Business.created_by_user_id → User.id
    await queryInterface.addConstraint('Businesses', {
      fields: ['created_by_user_id'],
      type: 'foreign key',
      name: 'fk_business_created_by_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 2. BusinessMember.user_id → User.id
    await queryInterface.addConstraint('BusinessMembers', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_businessmember_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 3. BusinessMember.business_id → Business.id
    await queryInterface.addConstraint('BusinessMembers', {
      fields: ['business_id'],
      type: 'foreign key',
      name: 'fk_businessmember_business',
      references: {
        table: 'Businesses',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 4. Pocket.owner_user_id → User.id
    await queryInterface.addConstraint('Pockets', {
      fields: ['owner_user_id'],
      type: 'foreign key',
      name: 'fk_pocket_owner_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 5. Pocket.business_id → Business.id
    await queryInterface.addConstraint('Pockets', {
      fields: ['business_id'],
      type: 'foreign key',
      name: 'fk_pocket_business',
      references: {
        table: 'Businesses',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 6. PocketMember.user_id → User.id
    await queryInterface.addConstraint('PocketMembers', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_pocketmember_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 7. PocketMember.pocket_id → Pocket.id
    await queryInterface.addConstraint('PocketMembers', {
      fields: ['pocket_id'],
      type: 'foreign key',
      name: 'fk_pocketmember_pocket',
      references: {
        table: 'Pockets',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 8. Transaction.initiator_user_id → User.id
    await queryInterface.addConstraint('Transactions', {
      fields: ['initiator_user_id'],
      type: 'foreign key',
      name: 'fk_transaction_initiator_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 9. Transaction.pocket_id → Pocket.id
    await queryInterface.addConstraint('Transactions', {
      fields: ['pocket_id'],
      type: 'foreign key',
      name: 'fk_transaction_pocket',
      references: {
        table: 'Pockets',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 10. TransactionApproval.transaction_id → Transaction.id
    await queryInterface.addConstraint('TransactionApprovals', {
      fields: ['transaction_id'],
      type: 'foreign key',
      name: 'fk_transactionapproval_transaction',
      references: {
        table: 'Transactions',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 11. TransactionApproval.approver_user_id → User.id
    await queryInterface.addConstraint('TransactionApprovals', {
      fields: ['approver_user_id'],
      type: 'foreign key',
      name: 'fk_transactionapproval_approver_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // 12. Notification.user_id → User.id
    await queryInterface.addConstraint('Notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_notification_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 13. PaymentPlanner.user_id → User.id
    await queryInterface.addConstraint('PaymentPlanners', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_paymentplanner_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 14. PaymentPlanner.pocket_id → Pocket.id
    await queryInterface.addConstraint('PaymentPlanners', {
      fields: ['pocket_id'],
      type: 'foreign key',
      name: 'fk_paymentplanner_pocket',
      references: {
        table: 'Pockets',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 15. BusinessSplitRule.user_id → User.id
    await queryInterface.addConstraint('BusinessSplitRules', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_businesssplitrule_user',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 16. BusinessSplitRule.pocket_id → Pocket.id
    await queryInterface.addConstraint('BusinessSplitRules', {
      fields: ['pocket_id'],
      type: 'foreign key',
      name: 'fk_businesssplitrule_pocket',
      references: {
        table: 'Pockets',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add Indexes untuk performance
    await queryInterface.addIndex('Businesses', ['created_by_user_id']);
    await queryInterface.addIndex('BusinessMembers', ['user_id', 'business_id']);
    await queryInterface.addIndex('Pockets', ['owner_user_id']);
    await queryInterface.addIndex('Pockets', ['business_id']);
    await queryInterface.addIndex('PocketMembers', ['user_id', 'pocket_id']);
    await queryInterface.addIndex('Transactions', ['initiator_user_id']);
    await queryInterface.addIndex('Transactions', ['pocket_id']);
    await queryInterface.addIndex('TransactionApprovals', ['transaction_id']);
    await queryInterface.addIndex('TransactionApprovals', ['approver_user_id']);
    await queryInterface.addIndex('Notifications', ['user_id']);
    await queryInterface.addIndex('PaymentPlanners', ['user_id']);
    await queryInterface.addIndex('PaymentPlanners', ['pocket_id']);
    await queryInterface.addIndex('BusinessSplitRules', ['user_id']);
    await queryInterface.addIndex('BusinessSplitRules', ['pocket_id']);
  },

  async down(queryInterface, Sequelize) {
    // Remove all constraints
    const constraints = [
      'fk_business_created_by_user',
      'fk_businessmember_user',
      'fk_businessmember_business',
      'fk_pocket_owner_user',
      'fk_pocket_business',
      'fk_pocketmember_user',
      'fk_pocketmember_pocket',
      'fk_transaction_initiator_user',
      'fk_transaction_pocket',
      'fk_transactionapproval_transaction',
      'fk_transactionapproval_approver_user',
      'fk_notification_user',
      'fk_paymentplanner_user',
      'fk_paymentplanner_pocket',
      'fk_businesssplitrule_user',
      'fk_businesssplitrule_pocket'
    ];

    const tables = [
      'Businesses', 'BusinessMembers', 'BusinessMembers',
      'Pockets', 'Pockets', 'PocketMembers', 'PocketMembers',
      'Transactions', 'Transactions', 'TransactionApprovals',
      'TransactionApprovals', 'Notifications', 'PaymentPlanners',
      'PaymentPlanners', 'BusinessSplitRules', 'BusinessSplitRules'
    ];

    for (let i = 0; i < constraints.length; i++) {
      await queryInterface.removeConstraint(tables[i], constraints[i]);
    }
  }
};