import { Client, Databases, Query } from 'appwrite';

class AppwriteService {
  constructor() {
    this.client = new Client();
    this.databases = null;
    this.config = null;
    this.active = false;
  }

  init(config) {
    if (!config || !config.endpoint || !config.projectId || !config.databaseId || !config.collectionId) {
      this.active = false;
      return false;
    }

    try {
      this.client
        .setEndpoint(config.endpoint)
        .setProject(config.projectId);
      this.databases = new Databases(this.client);
      this.config = config;
      this.active = true;
      return true;
    } catch (err) {
      console.error("Appwrite Init Error:", err);
      this.active = false;
      return false;
    }
  }

  async getPatients() {
    if (!this.active) return [];
    try {
      const response = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.collectionId,
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );
      return response.documents.map(doc => ({
        id: doc.patientId || doc.$id,
        name: doc.name,
        age: doc.age,
        gender: doc.gender,
        mobile: doc.mobile,
        symptoms: doc.symptoms,
        department: doc.department,
        severity: doc.severity,
        waitTime: doc.waitTime,
        status: doc.status,
        isVoice: doc.isVoice,
        $id: doc.$id
      }));
    } catch (err) {
      console.error("Appwrite getPatients Error:", err);
      throw err;
    }
  }

  async createPatient(patient) {
    if (!this.active) return null;
    try {
      const data = {
        patientId: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        mobile: patient.mobile,
        symptoms: patient.symptoms,
        department: patient.department,
        severity: patient.severity,
        waitTime: patient.waitTime,
        status: patient.status,
        isVoice: !!patient.isVoice
      };
      
      const doc = await this.databases.createDocument(
        this.config.databaseId,
        this.config.collectionId,
        'unique()',
        data
      );
      return doc;
    } catch (err) {
      console.error("Appwrite createPatient Error:", err);
      throw err;
    }
  }

  async updatePatientStatus(docId, status) {
    if (!this.active) return null;
    try {
      const doc = await this.databases.updateDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId,
        { status }
      );
      return doc;
    } catch (err) {
      console.error("Appwrite updatePatientStatus Error:", err);
      throw err;
    }
  }

  async deletePatient(docId) {
    if (!this.active) return null;
    try {
      await this.databases.deleteDocument(
        this.config.databaseId,
        this.config.collectionId,
        docId
      );
      return true;
    } catch (err) {
      console.error("Appwrite deletePatient Error:", err);
      throw err;
    }
  }

  subscribe(callback) {
    if (!this.active) return null;
    try {
      const channel = `databases.${this.config.databaseId}.collections.${this.config.collectionId}.documents`;
      return this.client.subscribe(channel, response => {
        callback(response);
      });
    } catch (err) {
      console.error("Appwrite Subscription Error:", err);
      return null;
    }
  }
}

export const appwriteService = new AppwriteService();
