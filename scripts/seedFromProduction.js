import { PrismaClient } from "@prisma/client";

const prodDb = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://default:SpYG4tdes0IK@ep-noisy-bread-75987818-pooler.us-east-1.postgres.vercel-storage.com/verceldb"
    }
  }
});

const localDb = new PrismaClient();

async function seedFromProduction() {
  try {
    console.log("🔄 Fetching data from production database...");

    const prodUsers = await prodDb.user.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      include: {
        characters: {
          include: {
            character: true
          },
          take: 10
        },
        groupUsers: {
          include: {
            group: true
          },
          take: 5
        }
      }
    });

    console.log(`✅ Found ${prodUsers.length} users from production`);

    console.log("🔄 Seeding users to local database...");

    for (const prodUser of prodUsers) {
      console.log(`  → Seeding user: ${prodUser.name || prodUser.email}`);
      
      await localDb.user.upsert({
        where: { clerkUserId: prodUser.clerkUserId },
        update: {
          email: prodUser.email,
          name: prodUser.name,
          accountId: prodUser.accountId
        },
        create: {
          clerkUserId: prodUser.clerkUserId,
          email: prodUser.email,
          name: prodUser.name,
          accountId: prodUser.accountId
        }
      });

      for (const userChar of prodUser.characters) {
        console.log(`    → Seeding character: ${userChar.character.characterName}`);
        
        await localDb.character.upsert({
          where: { webId: userChar.character.webId },
          update: userChar.character,
          create: userChar.character
        });

        await localDb.userCharacter.upsert({
          where: {
            clerkUserId_characterId: {
              clerkUserId: userChar.clerkUserId,
              characterId: userChar.characterId
            }
          },
          update: {},
          create: {
            characterId: userChar.characterId,
            clerkUserId: userChar.clerkUserId
          }
        });
      }

      for (const groupUser of prodUser.groupUsers) {
        console.log(`    → Seeding group: ${groupUser.group.name}`);
        
        await localDb.group.upsert({
          where: { id: groupUser.group.id },
          update: groupUser.group,
          create: groupUser.group
        });

        await localDb.groupUser.upsert({
          where: { id: groupUser.id },
          update: {
            groupId: groupUser.groupId,
            clerkUserId: groupUser.clerkUserId,
            characterId: groupUser.characterId,
            isInActiveGroup: groupUser.isInActiveGroup
          },
          create: {
            groupId: groupUser.groupId,
            clerkUserId: groupUser.clerkUserId,
            characterId: groupUser.characterId,
            isInActiveGroup: groupUser.isInActiveGroup
          }
        });
      }
    }

    const batchStates = await prodDb.batchState.findMany();
    console.log(`🔄 Seeding ${batchStates.length} batch states...`);
    
    for (const batchState of batchStates) {
      await localDb.batchState.upsert({
        where: { key: batchState.key },
        update: batchState,
        create: batchState
      });
    }

    const heraldBatchStates = await prodDb.heraldBatchState.findMany();
    console.log(`🔄 Seeding ${heraldBatchStates.length} herald batch states...`);
    
    for (const heraldBatchState of heraldBatchStates) {
      await localDb.heraldBatchState.upsert({
        where: { key: heraldBatchState.key },
        update: heraldBatchState,
        create: heraldBatchState
      });
    }

    console.log("🎉 Production data seeding complete!");
    
    const localUserCount = await localDb.user.count();
    const localCharacterCount = await localDb.character.count();
    const localGroupCount = await localDb.group.count();
    
    console.log(`📊 Local database now contains:`);
    console.log(`   • ${localUserCount} users`);
    console.log(`   • ${localCharacterCount} characters`);
    console.log(`   • ${localGroupCount} groups`);

  } catch (error) {
    console.error("❌ Error seeding from production:", error);
    throw error;
  } finally {
    await prodDb.$disconnect();
    await localDb.$disconnect();
  }
}

seedFromProduction()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });