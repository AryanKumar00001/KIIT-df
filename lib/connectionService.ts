import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import { db } from "./firebase"

export interface ConnectionRequest {
  id: string
  fromUserId: string
  toUserId: string
  fromUserName: string
  fromUserPhoto?: string
  toUserName: string
  toUserPhoto?: string
  status: "pending" | "accepted" | "declined"
  createdAt: Date
  updatedAt: Date
}

export interface Connection {
  id: string
  user1Id: string
  user2Id: string
  user1Name: string
  user2Name: string
  user1Photo?: string
  user2Photo?: string
  connectedAt: Date
}

// Send connection request
export const sendConnectionRequest = async (
  fromUserId: string,
  toUserId: string,
  fromUserName: string,
  toUserName: string,
  fromUserPhoto?: string,
  toUserPhoto?: string,
): Promise<boolean> => {
  try {
    // Check if request already exists
    const existingRequest = await getConnectionRequest(fromUserId, toUserId)
    if (existingRequest && existingRequest.status === "pending") {
      return false // Request already exists and is pending
    }

    // Check if they're already connected
    const isConnected = await areUsersConnected(fromUserId, toUserId)
    if (isConnected) {
      return false // Already connected
    }

    // If there's an old declined request, delete it first
    if (existingRequest) {
      await deleteDoc(doc(db, "connectionRequests", existingRequest.id))
    }

    const requestId = `${fromUserId}_${toUserId}`
    const connectionRequest: ConnectionRequest = {
      id: requestId,
      fromUserId,
      toUserId,
      fromUserName,
      toUserName,
      fromUserPhoto,
      toUserPhoto,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, "connectionRequests", requestId), connectionRequest)

    // Add to user's sent requests
    await updateDoc(doc(db, "users", fromUserId), {
      sentConnectionRequests: arrayUnion(requestId),
      updatedAt: new Date(),
    })

    // Add to user's received requests
    await updateDoc(doc(db, "users", toUserId), {
      receivedConnectionRequests: arrayUnion(requestId),
      updatedAt: new Date(),
    })

    return true
  } catch (error) {
    console.error("Error sending connection request:", error)
    return false
  }
}

// Cancel connection request (new function)
export const cancelConnectionRequest = async (requestId: string): Promise<boolean> => {
  try {
    const requestDoc = await getDoc(doc(db, "connectionRequests", requestId))
    if (!requestDoc.exists()) {
      return false
    }

    const request = requestDoc.data() as ConnectionRequest

    // Delete the request document
    await deleteDoc(doc(db, "connectionRequests", requestId))

    // Remove from both users' pending requests
    await updateDoc(doc(db, "users", request.fromUserId), {
      sentConnectionRequests: arrayRemove(requestId),
    })

    await updateDoc(doc(db, "users", request.toUserId), {
      receivedConnectionRequests: arrayRemove(requestId),
    })

    return true
  } catch (error) {
    console.error("Error canceling connection request:", error)
    return false
  }
}

// Accept connection request
export const acceptConnectionRequest = async (requestId: string): Promise<boolean> => {
  try {
    const requestDoc = await getDoc(doc(db, "connectionRequests", requestId))
    if (!requestDoc.exists()) {
      return false
    }

    const request = requestDoc.data() as ConnectionRequest

    // Create connection
    const connectionId = `${request.fromUserId}_${request.toUserId}`
    const connection: Connection = {
      id: connectionId,
      user1Id: request.fromUserId,
      user2Id: request.toUserId,
      user1Name: request.fromUserName,
      user2Name: request.toUserName,
      user1Photo: request.fromUserPhoto,
      user2Photo: request.toUserPhoto,
      connectedAt: new Date(),
    }

    await setDoc(doc(db, "connections", connectionId), connection)

    // Update request status
    await updateDoc(doc(db, "connectionRequests", requestId), {
      status: "accepted",
      updatedAt: new Date(),
    })

    // Add to both users' connections
    await updateDoc(doc(db, "users", request.fromUserId), {
      connections: arrayUnion(connectionId),
      connectionsCount: (await getUserConnectionsCount(request.fromUserId)) + 1,
      updatedAt: new Date(),
    })

    await updateDoc(doc(db, "users", request.toUserId), {
      connections: arrayUnion(connectionId),
      connectionsCount: (await getUserConnectionsCount(request.toUserId)) + 1,
      updatedAt: new Date(),
    })

    // Remove from pending requests
    await updateDoc(doc(db, "users", request.fromUserId), {
      sentConnectionRequests: arrayRemove(requestId),
    })

    await updateDoc(doc(db, "users", request.toUserId), {
      receivedConnectionRequests: arrayRemove(requestId),
    })

    return true
  } catch (error) {
    console.error("Error accepting connection request:", error)
    return false
  }
}

// Decline connection request
export const declineConnectionRequest = async (requestId: string): Promise<boolean> => {
  try {
    const requestDoc = await getDoc(doc(db, "connectionRequests", requestId))
    if (!requestDoc.exists()) {
      return false
    }

    const request = requestDoc.data() as ConnectionRequest

    // Delete the request document completely instead of just updating status
    await deleteDoc(doc(db, "connectionRequests", requestId))

    // Remove from both users' pending requests
    await updateDoc(doc(db, "users", request.fromUserId), {
      sentConnectionRequests: arrayRemove(requestId),
    })

    await updateDoc(doc(db, "users", request.toUserId), {
      receivedConnectionRequests: arrayRemove(requestId),
    })

    return true
  } catch (error) {
    console.error("Error declining connection request:", error)
    return false
  }
}

// Remove connection
export const removeConnection = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const connectionId1 = `${userId1}_${userId2}`
    const connectionId2 = `${userId2}_${userId1}`

    // Try both possible connection IDs
    let connectionId = connectionId1
    let connectionDoc = await getDoc(doc(db, "connections", connectionId1))

    if (!connectionDoc.exists()) {
      connectionId = connectionId2
      connectionDoc = await getDoc(doc(db, "connections", connectionId2))
    }

    if (!connectionDoc.exists()) {
      return false
    }

    // Delete connection
    await deleteDoc(doc(db, "connections", connectionId))

    // Remove from both users' connections
    await updateDoc(doc(db, "users", userId1), {
      connections: arrayRemove(connectionId),
      connectionsCount: Math.max(0, (await getUserConnectionsCount(userId1)) - 1),
      updatedAt: new Date(),
    })

    await updateDoc(doc(db, "users", userId2), {
      connections: arrayRemove(connectionId),
      connectionsCount: Math.max(0, (await getUserConnectionsCount(userId2)) - 1),
      updatedAt: new Date(),
    })

    // Delete any existing connection requests between these users
    const requestId1 = `${userId1}_${userId2}`
    const requestId2 = `${userId2}_${userId1}`

    const requestDoc1 = await getDoc(doc(db, "connectionRequests", requestId1))
    if (requestDoc1.exists()) {
      await deleteDoc(doc(db, "connectionRequests", requestId1))
    }

    const requestDoc2 = await getDoc(doc(db, "connectionRequests", requestId2))
    if (requestDoc2.exists()) {
      await deleteDoc(doc(db, "connectionRequests", requestId2))
    }

    return true
  } catch (error) {
    console.error("Error removing connection:", error)
    return false
  }
}

// Get connection request between two users
export const getConnectionRequest = async (fromUserId: string, toUserId: string): Promise<ConnectionRequest | null> => {
  try {
    const requestId1 = `${fromUserId}_${toUserId}`
    const requestId2 = `${toUserId}_${fromUserId}`

    // Check both directions
    let requestDoc = await getDoc(doc(db, "connectionRequests", requestId1))
    if (requestDoc.exists()) {
      return requestDoc.data() as ConnectionRequest
    }

    requestDoc = await getDoc(doc(db, "connectionRequests", requestId2))
    if (requestDoc.exists()) {
      return requestDoc.data() as ConnectionRequest
    }

    return null
  } catch (error) {
    console.error("Error getting connection request:", error)
    return null
  }
}

// Check if two users are connected
export const areUsersConnected = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const connectionId1 = `${userId1}_${userId2}`
    const connectionId2 = `${userId2}_${userId1}`

    const connection1 = await getDoc(doc(db, "connections", connectionId1))
    const connection2 = await getDoc(doc(db, "connections", connectionId2))

    return connection1.exists() || connection2.exists()
  } catch (error) {
    console.error("Error checking connection:", error)
    return false
  }
}

// Get user's connection requests (received)
export const getUserConnectionRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  try {
    const requestsRef = collection(db, "connectionRequests")
    const q = query(requestsRef, where("toUserId", "==", userId), where("status", "==", "pending"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => doc.data() as ConnectionRequest)
  } catch (error) {
    console.error("Error getting connection requests:", error)
    return []
  }
}

// Get user's connections
export const getUserConnections = async (userId: string): Promise<Connection[]> => {
  try {
    const connectionsRef = collection(db, "connections")
    const q1 = query(connectionsRef, where("user1Id", "==", userId))
    const q2 = query(connectionsRef, where("user2Id", "==", userId))

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)])

    const connections: Connection[] = []
    snapshot1.docs.forEach((doc) => connections.push(doc.data() as Connection))
    snapshot2.docs.forEach((doc) => connections.push(doc.data() as Connection))

    return connections
  } catch (error) {
    console.error("Error getting user connections:", error)
    return []
  }
}

// Get user's connections count
export const getUserConnectionsCount = async (userId: string): Promise<number> => {
  try {
    const connections = await getUserConnections(userId)
    return connections.length
  } catch (error) {
    console.error("Error getting connections count:", error)
    return 0
  }
}

// Get connection status between current user and target user
export const getConnectionStatus = async (
  currentUserId: string,
  targetUserId: string,
): Promise<{
  status: "none" | "sent" | "received" | "connected"
  requestId?: string
}> => {
  try {
    // Check if connected
    const isConnected = await areUsersConnected(currentUserId, targetUserId)
    if (isConnected) {
      return { status: "connected" }
    }

    // Check for pending requests
    const request = await getConnectionRequest(currentUserId, targetUserId)
    if (request && request.status === "pending") {
      if (request.fromUserId === currentUserId) {
        return { status: "sent", requestId: request.id }
      } else {
        return { status: "received", requestId: request.id }
      }
    }

    return { status: "none" }
  } catch (error) {
    console.error("Error getting connection status:", error)
    return { status: "none" }
  }
}
