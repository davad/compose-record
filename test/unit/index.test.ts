import { expect } from 'chai';
import { Immutable, compose } from '../../src/index';

describe('compose', () => {
    context('Flat structure', () => {
        it('should create an empty Immutable Record', () => {
            const Record = compose({
                name: 'Void',
            });

            const r = new Record();

            expect(r.toJS()).to.eql({});
        });

        it('should create an Immutable Record', () => {
            interface User {
                username: string;
                authenticated: boolean;
                age: number;
            }

            const UserRecord = compose<User>({
                name: 'User',
                properties: {
                    username: {
                        type: String,
                    },
                    authenticated: {
                        type: Boolean,
                    },
                    age: {
                        type: Number,
                    },
                },
            });

            const values = {
                username: 'mwazowski',
                authenticated: true,
                age: 30,
            };
            const u = new UserRecord(values);

            expect(u.toJS(), 'to keep passed values').to.eql(values);
            expect(u.set('username', 'jsullivan'), 'to be immutable').to.not.equal(u);
        });

        it('should create an Immutable Record with custom default values', () => {
            interface User {
                username: string;
                authenticated: boolean;
                age: number;
            }

            const UserRecord = compose<User>({
                name: 'User',
                properties: {
                    username: {
                        type: String,
                        defaultValue: 'mwazowski',
                    },
                    authenticated: {
                        type: Boolean,
                        defaultValue: true,
                    },
                    age: {
                        type: Number,
                        defaultValue: 30,
                    },
                },
            });

            const u = new UserRecord();

            expect(u.toJS(), 'to keep passed values').to.eql({
                username: 'mwazowski',
                authenticated: true,
                age: 30,
            });
        });

        it('should do type check for primitive values', () => {
            interface User {
                username: string;
                authenticated: boolean;
                age: number;
            }

            const UserRecord = compose<User>({
                name: 'User',
                properties: {
                    username: {
                        type: String,
                    },
                    authenticated: {
                        type: Boolean,
                    },
                    age: {
                        type: Number,
                    },
                },
            });

            const values = {
                username: 'mwazowski',
                authenticated: 'fdfd',
                age: 'fdfds',
            };
            const u = new UserRecord(values as any);

            expect(u.toJS(), 'to keep passed values').to.eql({
                username: 'mwazowski',
                authenticated: true,
                age: NaN,
            });
            expect(u.set('username', 'jsullivan'), 'to be immutable').to.not.equal(u);
        });
    });

    context('Nested structure', () => {
        it('should create an Immutable Record with nested Immutable structures ', () => {
            interface UserPojo {
                username: string;
                role: 'user' | 'admin';
            }

            interface ProfilePojo {
                id: number;
                name: string;
                user: UserPojo;
            }

            interface User extends UserPojo, Immutable {}

            interface Profile extends Immutable {
                id: number;
                name: string;
                user: User;
            }

            const UserRecord = compose<User, UserPojo>({
                name: 'User',
                properties: {
                    username: {
                        type: String,
                    },
                    role: {
                        type: String,
                    },
                },
            });

            const ProfileRecord = compose<Profile, ProfilePojo>({
                name: 'Profile',
                properties: {
                    id: {
                        type: Number,
                    },
                    name: {
                        type: String,
                    },
                    user: {
                        type: UserRecord,
                    },
                },
            });

            const values: ProfilePojo = {
                id: 1,
                name: 'Mike Wazowski',
                user: {
                    username: 'mwazowski',
                    role: 'user',
                },
            };
            const u = new ProfileRecord(values);

            expect(u.toJS(), 'to keep passed values').to.eql(values);
            expect(u.setIn(['user', 'username'], 'jsullivan'), 'to be immutable').to.not.equal(u);
        });

        it('should create an Immutable Record with custom default values', () => {
            interface UserPojo {
                username: string;
                role: 'user' | 'admin';
            }

            interface ProfilePojo {
                id: number;
                name: string;
                user: UserPojo;
            }

            interface User extends UserPojo, Immutable {}

            interface Profile extends Immutable {
                id: number;
                name: string;
                user: User;
            }

            const UserRecord = compose<User, UserPojo>({
                name: 'User',
                properties: {
                    username: {
                        type: String,
                    },
                    role: {
                        type: String,
                        defaultValue: 'user',
                    },
                },
            });

            const ProfileRecord = compose<Profile, ProfilePojo>({
                name: 'Profile',
                properties: {
                    id: {
                        type: Number,
                    },
                    name: {
                        type: String,
                    },
                    user: {
                        type: UserRecord,
                    },
                },
            });

            const u = new ProfileRecord();

            expect(u.toJS(), 'to keep passed values').to.eql({
                id: 0,
                name: '',
                user: {
                    username: '',
                    role: 'user',
                },
            });
            expect(u.setIn(['user', 'username'], 'jsullivan'), 'to be immutable').to.not.equal(u);
        });

        context('When property is nullable', () => {
            it('should ignore default values for', () => {
                interface UserPojo {
                    username: string;
                    role: 'user' | 'admin';
                }

                interface ProfilePojo {
                    id: number;
                    name: string;
                    user?: UserPojo;
                }

                interface User extends UserPojo, Immutable {}

                interface Profile extends Immutable {
                    id: number;
                    name: string;
                    user?: User;
                }

                const UserRecord = compose<User, UserPojo>({
                    name: 'User',
                    properties: {
                        username: {
                            type: String,
                        },
                        role: {
                            type: String,
                            defaultValue: 'user',
                        },
                    },
                });

                const ProfileRecord = compose<Profile, ProfilePojo>({
                    name: 'Profile',
                    properties: {
                        id: {
                            type: Number,
                        },
                        name: {
                            type: String,
                        },
                        user: {
                            type: UserRecord,
                            nullable: true,
                        },
                    },
                });

                const u = new ProfileRecord();

                expect(u.toJS(), 'to keep passed values').to.eql({
                    id: 0,
                    name: '',
                    user: null,
                });
            });
        });
    });

    context('When "extends" is defined', () => {
        it('should extend a new record by a given one', () => {
            interface Entity {
                id: number;
                createdAt: Date;
                updatedAt: Date;
            }

            const EntityRecord = compose<Entity>({
                name: 'Entity',
                properties: {
                    id: {
                        type: Number,
                    },
                    createdAt: {
                        type: Date,
                    },
                    updatedAt: {
                        type: Date,
                    },
                },
            });

            interface User extends Entity {}

            const UserRecord = compose<User>({
                name: 'User',
                extends: EntityRecord,
            });

            const value: Entity = {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const u = new UserRecord(value);

            expect(u.toJS()).to.eql(value);
        });

        it('should extend a record with custom properties', () => {
            interface Entity {
                id: number;
                createdAt: Date;
                updatedAt: Date;
            }

            const EntityRecord = compose<Entity>({
                name: 'Entity',
                properties: {
                    id: {
                        type: Number,
                    },
                    createdAt: {
                        type: Date,
                    },
                    updatedAt: {
                        type: Date,
                    },
                },
            });

            interface User extends Entity {
                name: string;
            }

            const UserRecord = compose<User>({
                name: 'User',
                extends: EntityRecord,
                properties: {
                    name: {
                        type: String,
                    },
                },
            });

            const value: User = {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                name: 'mwazowski',
            };
            const u = new UserRecord(value);

            expect(u.toJS()).to.eql(value);
        });

        it('should extend multiple extension records', () => {
            interface Entity {
                id: number;
                createdAt: Date;
                updatedAt: Date;
            }

            interface Schema {
                name: string;
                version: string;
            }

            interface Document {
                meta: Schema;
            }

            const EntityRecord = compose<Entity>({
                name: 'Entity',
                properties: {
                    id: {
                        type: Number,
                    },
                },
            });

            const SchemaRecord = compose<Schema>({
                name: 'Schema',
                properties: {
                    name: {
                        type: String,
                    },
                    version: {
                        type: String,
                    },
                },
            });

            const DocumentRecord = compose<Document>({
                name: 'Document',
                properties: {
                    meta: {
                        type: SchemaRecord,
                    },
                },
            });

            interface User extends Entity, Document {
                name: string;
            }

            const UserRecord = compose<User>({
                name: 'User',
                extends: [EntityRecord, DocumentRecord],
                properties: {
                    name: {
                        type: String,
                    },
                },
            });

            const u = new UserRecord();

            expect(u.toJS()).to.eql({
                id: 0,
                meta: {
                    name: '',
                    version: '',
                },
                name: '',
            });
        });
    });
});