import { Gender, UserType, MhpssLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { consumeVerification } from '@/lib/otp';
import { createPendingRoleRequest } from '@/lib/roleRequests';
import { normalizeEmail, validPassword, WorkflowError } from '@/lib/validation';
import { certificatePath, readCertificate } from '@/lib/certificates';
export async function registerUser(form: FormData) {
    const value = (key: string) => String(form.get(key) || '').trim();
    const email = normalizeEmail(value('email')),
        firstName = value('firstName'),
        lastName = value('lastName'),
        role = value('role'),
        gender = value('gender'),
        region = value('region'),
        organization = value('responderOrganization'),
        level = value('mhpssLevel');
    const password = String(form.get('password') || '');
    if (
        !firstName ||
        !lastName ||
        firstName.length > 100 ||
        lastName.length > 100 ||
        !region ||
        region.length > 100 ||
        !Object.values(Gender).includes(gender as Gender) ||
        !Object.values(UserType).includes(role as UserType)
    )
        throw new WorkflowError('Complete all required profile fields.');
    if (value('privacyPolicyAccepted') !== 'true')
        throw new WorkflowError('Accept the Privacy Policy to register.');
    if (
        !validPassword(password) ||
        password !== String(form.get('confirmPassword') || '')
    )
        throw new WorkflowError(
            'Passwords must match and contain 8–128 characters, an uppercase letter and a symbol.'
        );
    const verificationToken = value('verificationToken');
    if (!/^[a-f0-9]{64}$/.test(verificationToken))
        throw new WorkflowError('Verify your email before registering.', 403);
    if (
        role === 'RESPONDER' &&
        (!organization ||
            organization.length > 200 ||
            !Object.values(MhpssLevel).includes(level as MhpssLevel))
    )
        throw new WorkflowError('Organization and MHPSS level are required.');
    const certificate =
        role === 'RESPONDER'
            ? await readCertificate(form.get('mhpssCertificateFile'))
            : null;
    const hash = await bcrypt.hash(password, 12);
    try {
        return await prisma.$transaction(async (tx) => {
            await consumeVerification(tx, email, verificationToken);
            const user = await tx.user.create({
                data: {
                    firstName,
                    lastName,
                    name: firstName + ' ' + lastName,
                    email,
                    emailVerified: new Date(),
                    password: hash,
                    gender: gender as Gender,
                    region,
                    privacyPolicyAccepted: true,
                    role: 'STANDARD',
                },
                select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    gender: true,
                    region: true,
                    role: true,
                    mhpssLevel: true,
                },
            });
            const uploaded = certificate
                ? await tx.certificateUpload.create({
                      data: { userId: user.id, ...certificate },
                      select: { id: true },
                  })
                : null;
            const request =
                role === 'STANDARD'
                    ? null
                    : await createPendingRoleRequest(
                          {
                              userId: user.id,
                              fromRole: 'STANDARD',
                              toRole: role as UserType,
                              requestedMhpssLevel:
                                  role === 'RESPONDER'
                                      ? (level as MhpssLevel)
                                      : null,
                              requestedResponderOrganization:
                                  role === 'RESPONDER' ? organization : null,
                              certificateId: uploaded?.id,
                              requestedMhpssCertificateFileUrl: uploaded
                                  ? certificatePath(uploaded.id)
                                  : null,
                          },
                          tx
                      );
            return { user, request };
        });
    } catch (e) {
        if ((e as { code?: string }).code === 'P2002')
            throw new WorkflowError('Email is already registered.', 409);
        throw e;
    }
}
